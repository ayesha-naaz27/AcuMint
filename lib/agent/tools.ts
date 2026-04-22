import { createClient } from '@/lib/supabase/server';
import { getBudgetStatus } from '@/lib/db/budgets';

export const TOOL_SCHEMAS = [
  {
    type: 'function' as const,
    function: {
      name: 'query_transactions',
      description:
        "Fetch the user's transactions with filters. Use when the user asks about specific merchants, categories, amounts, or time ranges. Returns up to 20 rows.",
      parameters: {
        type: 'object',
        properties: {
          merchant_contains: {
            type: 'string',
            description: 'Partial merchant name, e.g. "swiggy" or "metro".',
          },
          category_name: {
            type: 'string',
            description: 'Exact category name from the user\'s list, e.g. "Food & Dining".',
          },
          direction: {
            type: 'string',
            enum: ['debit', 'credit'],
            description: 'Only outgoing or only incoming.',
          },
          min_amount: { type: 'number' },
          max_amount: { type: 'number' },
          days_back: {
            type: 'integer',
            description:
              'Only consider transactions from the last N days. Use 7 for "this week", 30 for "this month".',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate_budget_health',
      description:
        "Returns the user's current budget status for every category they've set a budget on. Use when the user asks about budgets, overspending, or how much they have left to spend.",
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'forecast_spending',
      description:
        'Projects the user\'s total debit spending for the current calendar month, based on daily spending rate so far. Optionally filtered to one category. Use for questions like "will I hit my food budget this month?"',
      parameters: {
        type: 'object',
        properties: {
          category_name: {
            type: 'string',
            description: 'Optional category to project only.',
          },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'detect_recurring',
      description:
        'Identifies likely recurring payments by finding merchants the user has paid multiple times with similar amounts. Use for "what are my subscriptions" or "what bills do I pay regularly".',
      parameters: {
        type: 'object',
        properties: {
          lookback_days: {
            type: 'integer',
            description: 'How many days to look back. Default 90.',
          },
        },
      },
    },
  },
];

type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    switch (name) {
      case 'query_transactions':
        return { ok: true, data: await queryTransactions(args) };
      case 'calculate_budget_health':
        return { ok: true, data: await calculateBudgetHealth() };
      case 'forecast_spending':
        return { ok: true, data: await forecastSpending(args) };
      case 'detect_recurring':
        return { ok: true, data: await detectRecurring(args) };
      default:
        return { ok: false, error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function queryTransactions(args: Record<string, unknown>) {
  const supabase = await createClient();
  let q = supabase
    .from('transactions')
    .select(
      `id, amount, direction, merchant, occurred_at, notes,
       category:categories(name)`
    )
    .order('occurred_at', { ascending: false })
    .limit(20);

  if (typeof args.merchant_contains === 'string') {
    q = q.ilike('merchant', `%${args.merchant_contains}%`);
  }
  if (typeof args.direction === 'string') {
    q = q.eq('direction', args.direction);
  }
  if (typeof args.min_amount === 'number') {
    q = q.gte('amount', args.min_amount);
  }
  if (typeof args.max_amount === 'number') {
    q = q.lte('amount', args.max_amount);
  }
  if (typeof args.days_back === 'number') {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - args.days_back);
    q = q.gte('occurred_at', cutoff.toISOString());
  }
  if (typeof args.category_name === 'string') {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', args.category_name)
      .maybeSingle();
    if (cat) q = q.eq('category_id', cat.id);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return {
    count: data?.length ?? 0,
    transactions: (data ?? []).map((t) => ({
      amount: Number(t.amount),
      direction: t.direction,
      merchant: t.merchant,
      category: (t.category as { name: string } | null)?.name ?? null,
      occurred_at: t.occurred_at,
      notes: t.notes,
    })),
  };
}

async function calculateBudgetHealth() {
  const statuses = await getBudgetStatus();
  return {
    count: statuses.length,
    budgets: statuses.map((b) => ({
      category: b.category.name,
      monthly_limit: Number(b.monthly_limit),
      spent: b.spent,
      remaining: b.remaining,
      percent_used: b.percentUsed,
      level: b.level,
    })),
  };
}

async function forecastSpending(args: Record<string, unknown>) {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = Math.max(
    1,
    Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  );
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const { data, error } = await supabase
    .from('transactions')
    .select(`amount, category:categories(name)`)
    .eq('direction', 'debit')
    .gte('occurred_at', start.toISOString());

  if (error) throw new Error(error.message);

  const filtered =
    typeof args.category_name === 'string'
      ? (data ?? []).filter(
          (t) =>
            (t.category as { name: string } | null)?.name?.toLowerCase() ===
            (args.category_name as string).toLowerCase()
        )
      : data ?? [];

  const spentSoFar = filtered.reduce((s, t) => s + Number(t.amount), 0);
  const dailyRate = spentSoFar / daysElapsed;
  const projected = dailyRate * daysInMonth;

  return {
    category: (args.category_name as string) ?? 'all',
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    spent_so_far: Math.round(spentSoFar),
    daily_rate: Math.round(dailyRate),
    projected_month_end: Math.round(projected),
  };
}

async function detectRecurring(args: Record<string, unknown>) {
  const lookbackDays = typeof args.lookback_days === 'number' ? args.lookback_days : 90;
  const supabase = await createClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount, occurred_at')
    .eq('direction', 'debit')
    .gte('occurred_at', cutoff.toISOString());

  if (error) throw new Error(error.message);

  const byMerchant = new Map<string, { amounts: number[]; dates: string[] }>();
  for (const t of data ?? []) {
    if (!t.merchant) continue;
    const key = t.merchant.toLowerCase();
    const entry = byMerchant.get(key) ?? { amounts: [], dates: [] };
    entry.amounts.push(Number(t.amount));
    entry.dates.push(t.occurred_at);
    byMerchant.set(key, entry);
  }

  const recurring: {
    merchant: string;
    count: number;
    typical_amount: number;
    latest: string;
  }[] = [];
  for (const [merchant, e] of byMerchant) {
    if (e.amounts.length < 2) continue;
    const avg = e.amounts.reduce((a, b) => a + b, 0) / e.amounts.length;
    const spread = (Math.max(...e.amounts) - Math.min(...e.amounts)) / Math.max(avg, 1);
    if (spread < 0.2) {
      recurring.push({
        merchant,
        count: e.amounts.length,
        typical_amount: Math.round(avg),
        latest: e.dates.sort().at(-1)!,
      });
    }
  }

  return { count: recurring.length, recurring };
}
