import { formatINR, formatRelativeTime } from '@/lib/format';
import type { TransactionWithCategory } from '@/lib/types/database';

export function TransactionRow({ txn }: { txn: TransactionWithCategory }) {
  const isCredit = txn.direction === 'credit';
  const categoryColor = txn.category?.color ?? '#71717a';

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div
        className="h-10 w-10 flex-shrink-0 rounded-full"
        style={{ backgroundColor: `${categoryColor}22`, border: `1px solid ${categoryColor}55` }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-100">
          {txn.merchant ?? 'Unknown'}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {txn.category && (
            <>
              <span>{txn.category.name}</span>
              <span className="text-zinc-700">•</span>
            </>
          )}
          <span>{formatRelativeTime(txn.occurred_at)}</span>
        </div>
      </div>
      <p
        className={`font-mono text-sm font-semibold tabular-nums ${
          isCredit ? 'text-emerald-400' : 'text-zinc-100'
        }`}
      >
        {isCredit ? '+' : '−'}
        {formatINR(Number(txn.amount))}
      </p>
    </div>
  );
}
