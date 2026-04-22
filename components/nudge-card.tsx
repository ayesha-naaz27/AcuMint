// components/nudge-card.tsx
'use client';

import { useTransition } from 'react';
import { TrendingUp, AlertCircle, X } from 'lucide-react';
import { dismissNudge } from '@/lib/actions/nudges';
import type { Nudge } from '@/lib/db/nudges';

export function NudgeCard({ nudge }: { nudge: Nudge }) {
  const [isPending, startTransition] = useTransition();

  const isAlert = nudge.severity === 'alert';
  const Icon = isAlert ? AlertCircle : TrendingUp;
  const styles = isAlert
    ? {
        border: 'border-red-900/60',
        bg: 'bg-red-950/30',
        icon: 'text-red-400',
        title: 'text-red-300',
      }
    : {
        border: 'border-amber-900/60',
        bg: 'bg-amber-950/30',
        icon: 'text-amber-400',
        title: 'text-amber-300',
      };

  function dismiss() {
    startTransition(async () => { await dismissNudge(nudge.id); });
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border ${styles.border} ${styles.bg} p-4 ${isPending ? 'opacity-40' : ''}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${styles.icon}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium uppercase tracking-wider ${styles.title}`}>
          {isAlert ? 'Budget alert' : 'Heads up'}
        </p>
        <p className="mt-1 text-sm text-zinc-200">{nudge.message}</p>
      </div>
      <button
        onClick={dismiss}
        disabled={isPending}
        aria-label="Dismiss"
        className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
