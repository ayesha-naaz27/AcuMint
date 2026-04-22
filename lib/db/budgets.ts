import { createClient } from '@/lib/supabase/server';
import type {
  BudgetWithCategory,
  BudgetStatus,
  TransactionWithCategory,
} from '@/lib/types/database';
import { getTransactionsForMonth } from './transactions';

export async function getBudgets(): Promise<BudgetWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select(`*, category:categories(id, name, icon, color)`);
  if (error) {
    console.error('getBudgets failed:', error);
    return [];
  }
  return (data ?? []) as BudgetWithCategory[];
}

export async function getBudgetStatus(): Promise<BudgetStatus[]> {
  const now = new Date();
  const [budgets, txns] = await Promise.all([
    getBudgets(),
    getTransactionsForMonth(now.getFullYear(), now.getMonth() + 1),
  ]);

  const spendByCategory = new Map<string, number>();
  for (const t of txns as TransactionWithCategory[]) {
    if (t.direction !== 'debit' || !t.category_id) continue;
    spendByCategory.set(
      t.category_id,
      (spendByCategory.get(t.category_id) ?? 0) + Number(t.amount)
    );
  }

  return budgets.map((b) => {
    const spent = spendByCategory.get(b.category_id) ?? 0;
    const percentUsed = Math.round((spent / Number(b.monthly_limit)) * 100);
    const level: BudgetStatus['level'] =
      percentUsed >= 100 ? 'breach' : percentUsed >= 80 ? 'warning' : 'ok';
    return {
      ...b,
      spent,
      remaining: Number(b.monthly_limit) - spent,
      percentUsed,
      level,
    };
  });
}
