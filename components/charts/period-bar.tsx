'use client';

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

export function PeriodBar({ data }: { data: { name: string; amount: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-zinc-500">
        No spending in this period
      </div>
    );
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#a1a1aa' }}
            formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill="#34d399" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
