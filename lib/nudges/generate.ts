// lib/nudges/generate.ts
// Velocity-based nudge generation. Called by the daily cron job.

import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

type NudgeInsert = {
  user_id: string;
  kind: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
  metadata: Record<string, unknown>;
};

const MIN_DAY_FOR_PREDICTION = 5;
const OVERSHOOT_THRESHOLD_PCT = 10;
const ALERT_THRESHOLD_PCT = 25;
const DEDUPE_WINDOW_HOURS = 20;

export async function generateNudgesForCurrentUser(): Promise<NudgeInsert[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return generateNudgesForUser(user.id, supabase);
}

export async function generateNudgesForUser(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<NudgeInsert[]> {
  const now = new Date();
  const dayOfMonth = now.getDate();
  if (dayOfMonth < MIN_DAY_FOR_PREDICTION) return [];

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const { data: budgets } = await supabase
    .from('budgets')
    .select(`
      id, category_id, monthly_limit,
      category:categories(name)
    `)
    .eq('user_id', userId);

  if (!budgets || budgets.length === 0) return [];

  const { data: txns } = await supabase
    .from('transactions')
    .select('amount, category_id')
    .eq('user_id', userId)
    .eq('direction', 'debit')
    .gte('occurred_at', startOfMonth.toISOString());

  const spendByCategory = new Map<string, number>();
  for (const t of txns ?? []) {
    if (!t.category_id) continue;
    spendByCategory.set(
      t.category_id,
      (spendByCategory.get(t.category_id) ?? 0) + Number(t.amount)
    );
  }

  const dedupCutoff = new Date(
    now.getTime() - DEDUPE_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();
  const { data: recentNudges } = await supabase
    .from('nudges')
    .select('metadata')
    .eq('user_id', userId)
    .gte('created_at', dedupCutoff);

  const recentlyNudgedCategories = new Set<string>(
    (recentNudges ?? [])
      .map((n: { metadata: { category_id?: string } | null }) => n.metadata?.category_id)
      .filter(Boolean) as string[]
  );

  const nudges: NudgeInsert[] = [];

  for (const b of budgets) {
    if (recentlyNudgedCategories.has(b.category_id)) continue;

    const spent = spendByCategory.get(b.category_id) ?? 0;
    if (spent === 0) continue;

    const dailyRate = spent / dayOfMonth;
    const projected = dailyRate * daysInMonth;
    const limit = Number(b.monthly_limit);
    const overshootPct = Math.round(((projected - limit) / limit) * 100);

    if (overshootPct < OVERSHOOT_THRESHOLD_PCT) continue;

    const categoryName = (b.category as { name: string } | null)?.name ?? 'that category';
    const severity: 'warning' | 'alert' =
      overshootPct >= ALERT_THRESHOLD_PCT ? 'alert' : 'warning';

    const message =
      severity === 'alert'
        ? `At your current pace, ${categoryName} will overshoot your ₹${limit.toLocaleString('en-IN')} budget by about ${overshootPct}% this month.`
        : `Heads up — ${categoryName} is trending ${overshootPct}% over your ₹${limit.toLocaleString('en-IN')} budget for this month.`;

    nudges.push({
      user_id: userId,
      kind: 'budget_velocity',
      message,
      severity,
      metadata: {
        category_id: b.category_id,
        category_name: categoryName,
        spent_so_far: Math.round(spent),
        projected_month_end: Math.round(projected),
        overshoot_pct: overshootPct,
        monthly_limit: limit,
      },
    });
  }

  if (nudges.length > 0) {
    const { error } = await supabase.from('nudges').insert(nudges);
    if (error) console.error('nudge insert failed:', error);
  }

  return nudges;
}

export async function generateNudgesForAllUsers() {
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: userRows } = await serviceClient
    .from('budgets')
    .select('user_id');

  const uniqueUsers = Array.from(
    new Set((userRows ?? []).map((r) => r.user_id))
  );

  let totalNudges = 0;
  for (const uid of uniqueUsers) {
    const results = await generateNudgesForUser(uid, serviceClient);
    totalNudges += results.length;
  }

  return { usersProcessed: uniqueUsers.length, nudgesCreated: totalNudges };
}
