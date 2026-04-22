// app/(app)/settings/generate-nudge-button.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { runNudgeGenerationNow } from '@/lib/actions/nudges';

export function GenerateNudgeButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      const r = await runNudgeGenerationNow();
      if (!r.ok) {
        setResult(`Error: ${r.error}`);
      } else if (r.count === 0) {
        setResult('All good — no nudges needed right now.');
      } else {
        setResult(`Generated ${r.count} nudge${r.count === 1 ? '' : 's'}. Check Home.`);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={run}
        disabled={isPending}
        variant="outline"
        className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking your spending...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Run nudge check now
          </>
        )}
      </Button>
      {result && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-zinc-400">
          {result}
        </p>
      )}
    </div>
  );
}
