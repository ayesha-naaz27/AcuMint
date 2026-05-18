'use client';

import { useEffect, useState, useTransition } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PeriodBar } from '@/components/charts/period-bar';
import { formatINR } from '@/lib/format';
import { getAnalyticsAction } from '@/lib/actions/analytics';
import type { Period, AnalyticsResult } from '@/lib/db/analytics';

const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

export function AnalyticsView() {
  const [period, setPeriod] = useState<Period>('month');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getAnalyticsAction(period, offset);
      setData(result);
    });
  }, [period, offset]);

  return (
    <div className="mx-auto max-w-[480px] px-4 pb-28 pt-6">
      <h1 className="mb-4 text-xl font-semibold text-zinc-100">Analytics</h1>

      {/* Period toggle */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-900 p-1">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setOffset(0); }}
            className={`flex-1 rounded-md py-1.5 text-sm capitalize transition ${
              period === p ? 'bg-emerald-600 text-white' : 'text-zinc-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Period navigator */}
      <div className="mb-5 flex items-center justify-between">
        <button onClick={() => setOffset(offset - 1)} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-medium text-zinc-200">
          {data?.label ?? '…'}
        </span>
        <button
          onClick={() => setOffset(Math.min(offset + 1, 0))}
          disabled={offset >= 0}
          className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {isPending && !data ? (
        <div className="py-20 text-center text-sm text-zinc-500">Loading…</div>
      ) : data ? (
        <>
          {/* Income / Expense */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Income</div>
              <div className="mt-1 text-lg font-semibold text-emerald-400">{formatINR(data.income)}</div>
            </div>
            <div className="rounded-xl bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500">Expenses</div>
              <div className="mt-1 text-lg font-semibold text-red-400">{formatINR(data.expense)}</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="mb-5 rounded-xl bg-zinc-900 p-4">
            <div className="mb-3 text-sm font-medium text-zinc-300">Spending</div>
            <PeriodBar data={data.chart} />
          </div>

          {/* Category breakdown */}
          <div className="rounded-xl bg-zinc-900 p-4">
            <div className="mb-3 text-sm font-medium text-zinc-300">By category</div>
            {data.byCategory.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No expenses in this period</div>
            ) : (
              <div className="space-y-2">
                {data.byCategory.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-sm text-zinc-300">{c.name}</span>
                    </div>
                    <span className="text-sm text-zinc-400">{formatINR(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
