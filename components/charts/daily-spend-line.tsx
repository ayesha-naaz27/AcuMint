'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TransactionWithCategory } from '@/lib/types/database';
import { formatINR } from '@/lib/format';

type Point = { date: string; amount: number; label: string };

export function DailySpendLine({
  transactions,
}: {
  transactions: TransactionWithCategory[];
}) {
  const data: Point[] = useMemo(() => {
    const now = new Date();
    const days: Record<string, Point> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      days[key] = { date: key, label, amount: 0 };
    }
    for (const t of transactions) {
      if (t.direction !== 'debit') continue;
      const key = new Date(t.occurred_at).toISOString().slice(0, 10);
      if (days[key]) days[key].amount += Number(t.amount);
    }
    return Object.values(days);
  }, [transactions]);

  const hasData = data.some((d) => d.amount > 0);
  if (!hasData) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">Last 30 days</h2>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v) => (typeof v === 'number' ? formatINR(v) : '')}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
