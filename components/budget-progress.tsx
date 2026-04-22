import { AlertTriangle, AlertCircle } from 'lucide-react';
import { formatINR } from '@/lib/format';
import type { BudgetStatus } from '@/lib/types/database';

export function BudgetAlert({ statuses }: { statuses: BudgetStatus[] }) {
  const breaches = statuses.filter((s) => s.level === 'breach');
  const warnings = statuses.filter((s) => s.level === 'warning');

  if (breaches.length === 0 && warnings.length === 0) return null;

  if (breaches.length > 0) {
    const b = breaches[0];
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-900/60 bg-red-950/30 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-300">
            Budget exceeded: {b.category.name}
          </p>
          <p className="text-xs text-red-400/80 mt-0.5">
            {formatINR(b.spent)} of {formatINR(Number(b.monthly_limit))} ({b.percentUsed}%)
            {breaches.length > 1 && ` + ${breaches.length - 1} more`}
          </p>
        </div>
      </div>
    );
  }

  const w = warnings[0];
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-900/60 bg-amber-950/30 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-300">
          Nearing budget: {w.category.name}
        </p>
        <p className="text-xs text-amber-400/80 mt-0.5">
          {formatINR(w.spent)} of {formatINR(Number(w.monthly_limit))} ({w.percentUsed}%)
          {warnings.length > 1 && ` + ${warnings.length - 1} more`}
        </p>
      </div>
    </div>
  );
}

export function BudgetProgressList({ statuses }: { statuses: BudgetStatus[] }) {
  if (statuses.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">Budgets</h2>
      <ul className="space-y-4">
        {statuses.map((s) => {
          const width = Math.min(s.percentUsed, 100);
          const barColor =
            s.level === 'breach'
              ? 'bg-red-500'
              : s.level === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-500';
          return (
            <li key={s.id}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium text-zinc-300">
                  {s.category.name}
                </span>
                <span className="font-mono tabular-nums text-zinc-500">
                  {formatINR(s.spent)} / {formatINR(Number(s.monthly_limit))}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full transition-all ${barColor}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
