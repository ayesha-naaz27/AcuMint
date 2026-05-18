import { getTransactions } from '@/lib/db/transactions';
import type { TransactionWithCategory } from '@/lib/types/database';

export type Period = 'day' | 'week' | 'month' | 'year';

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
}

export function getPeriodRange(period: Period, offset: number): PeriodRange {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label: string;

  if (period === 'day') {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
    end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } else if (period === 'week') {
    const base = new Date(now);
    base.setDate(base.getDate() + offset * 7);
    const day = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    start = monday;
    end = sunday;
    label = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  } else if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } else {
    const year = now.getFullYear() + offset;
    start = new Date(year, 0, 1, 0, 0, 0);
    end = new Date(year, 11, 31, 23, 59, 59);
    label = String(year);
  }

  return { start, end, label };
}

export interface AnalyticsResult {
  label: string;
  income: number;
  expense: number;
  net: number;
  chart: { name: string; amount: number }[];
  byCategory: { name: string; color: string; amount: number }[];
}

export async function getAnalytics(period: Period, offset: number): Promise<AnalyticsResult> {
  const { start, end, label } = getPeriodRange(period, offset);

  const all: TransactionWithCategory[] = await getTransactions(1000);
  const inRange = all.filter((t) => {
    const d = new Date(t.occurred_at);
    return d >= start && d <= end;
  });

  let income = 0;
  let expense = 0;
  for (const t of inRange) {
    if (t.direction === 'credit') income += Number(t.amount);
    else expense += Number(t.amount);
  }

  const buckets = new Map<string, number>();
  const order: string[] = [];
  const sortMap = new Map<string, number>();

  const keyFor = (d: Date): { key: string; sort: number } => {
    if (period === 'day') return { key: `${d.getHours()}:00`, sort: d.getHours() };
    if (period === 'week') return { key: d.toLocaleDateString('en-IN', { weekday: 'short' }), sort: (d.getDay() + 6) % 7 };
    if (period === 'month') return { key: String(d.getDate()), sort: d.getDate() };
    return { key: d.toLocaleDateString('en-IN', { month: 'short' }), sort: d.getMonth() };
  };

  for (const t of inRange) {
    if (t.direction !== 'debit') continue;
    const d = new Date(t.occurred_at);
    const { key, sort } = keyFor(d);
    if (!buckets.has(key)) { buckets.set(key, 0); order.push(key); sortMap.set(key, sort); }
    buckets.set(key, buckets.get(key)! + Number(t.amount));
  }

  const chart = order
    .map((k) => ({ name: k, amount: Math.round(buckets.get(k)!) }))
    .sort((a, b) => (sortMap.get(a.name)! - sortMap.get(b.name)!));

  const cat = new Map<string, { color: string; amount: number }>();
  for (const t of inRange) {
    if (t.direction !== 'debit') continue;
    const name = t.category?.name ?? 'Uncategorised';
    const color = t.category?.color ?? '#71717a';
    if (!cat.has(name)) cat.set(name, { color, amount: 0 });
    cat.get(name)!.amount += Number(t.amount);
  }

  const byCategory = Array.from(cat.entries())
    .map(([name, v]) => ({ name, color: v.color, amount: Math.round(v.amount) }))
    .sort((a, b) => b.amount - a.amount);

  return { label, income, expense, net: income - expense, chart, byCategory };
}
