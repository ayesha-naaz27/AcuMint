import { createClient } from '@/lib/supabase/server';
import type { TransactionWithCategory } from '@/lib/types/database';

export async function getTransactions(limit?: number): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, icon, color)
    `)
    .order('occurred_at', { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('getTransactions failed:', error);
    return [];
  }
  return (data ?? []) as TransactionWithCategory[];
}

export async function getTransactionsForMonth(
  year: number,
  month: number
): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 1).toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select(`*, category:categories(id, name, icon, color)`)
    .gte('occurred_at', start)
    .lt('occurred_at', end)
    .order('occurred_at', { ascending: false });

  if (error) {
    console.error('getTransactionsForMonth failed:', error);
    return [];
  }
  return (data ?? []) as TransactionWithCategory[];
}

export async function getCurrentMonthSpend(): Promise<number> {
  const now = new Date();
  const txns = await getTransactionsForMonth(now.getFullYear(), now.getMonth() + 1);
  return txns
    .filter(t => t.direction === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
}
