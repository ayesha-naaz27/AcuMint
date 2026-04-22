'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { TransactionWithCategory } from '@/lib/types/database';
import { formatINR } from '@/lib/format';

type Slice = {
  name: string;
  value: number;
  color: string;
};

export function CategoryPie({
  transactions,
}: {
  transactions: TransactionWithCategory[];
}) {
  const data: Slice[] = useMemo(() => {
    const byCategory = new Map<string, Slice>();
    for (const t of transactions) {
      if (t.direction !== 'debit') continue;
      const name = t.category?.name ?? 'Uncategorized';
      const color = t.category?.color ?? '#71717a';
      const prev = byCategory.get(name) ?? { name, value: 0, color };
      prev.value += Number(t.amount);
      byCategory.set(name, prev);
    }
    return Array.from(byCategory.values()).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-zinc-400">
          Where your money goes
        </h2>
        <p className="font-mono text-xs tabular-nums text-zinc-500">
          {formatINR(total)} total
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={40}
                outerRadius={70}
                strokeWidth={0}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(v) => (typeof v === 'number' ? formatINR(v) : '')}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-2 self-center">
          {data.slice(0, 5).map((d) => (
            <li key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 truncate text-zinc-400">{d.name}</span>
              <span className="font-mono tabular-nums text-zinc-300">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
