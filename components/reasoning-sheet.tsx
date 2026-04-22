// components/reasoning-sheet.tsx
'use client';

import { useState } from 'react';
import { Info, Search, Wrench, Sparkles } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatINR, formatRelativeTime } from '@/lib/format';
import type { ChatReasoning } from '@/lib/db/chat';

export function WhyButton({ reasoning }: { reasoning: ChatReasoning | null }) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors"
      >
        <Info className="h-3 w-3" />
        Why?
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[85dvh] max-w-[480px] rounded-t-2xl border-zinc-800 bg-zinc-950 p-0"
        >
          <SheetHeader className="border-b border-zinc-800 p-6 pb-4 text-left">
            <SheetTitle className="text-zinc-100">How I got here</SheetTitle>
            <SheetDescription className="text-zinc-500 text-xs">
              The retrieval step, tools called, and assumptions made to answer your question.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="max-h-[70dvh]">
            <div className="space-y-6 p-6">
              <ReasoningSection
                icon={<Search className="h-4 w-4" />}
                title="Retrieved transactions"
                description={`${reasoning.retrieved_transactions.length} semantically relevant past transactions were pulled from your history to ground the answer.`}
              >
                {reasoning.retrieved_transactions.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No specifically relevant past transactions.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {reasoning.retrieved_transactions.map((r, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm text-zinc-200">
                            {r.merchant ?? 'Unknown'}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {formatRelativeTime(r.occurred_at)} ·{' '}
                            <span className="text-emerald-500 font-mono">
                              {(r.similarity * 100).toFixed(0)}% match
                            </span>
                          </p>
                        </div>
                        <p
                          className={`font-mono text-sm tabular-nums ${
                            r.direction === 'credit'
                              ? 'text-emerald-400'
                              : 'text-zinc-200'
                          }`}
                        >
                          {r.direction === 'credit' ? '+' : '−'}
                          {formatINR(Number(r.amount))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </ReasoningSection>

              <ReasoningSection
                icon={<Wrench className="h-4 w-4" />}
                title="Tools called"
                description={`The agent made ${reasoning.tool_calls.length} tool call${reasoning.tool_calls.length === 1 ? '' : 's'} across ${reasoning.rounds} reasoning round${reasoning.rounds === 1 ? '' : 's'}.`}
              >
                {reasoning.tool_calls.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No tools needed — the agent answered from context alone.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {reasoning.tool_calls.map((tc, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <code className="rounded-full border border-emerald-900/50 bg-emerald-950/40 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                            {tc.tool}
                          </code>
                          <p className="text-[11px] text-zinc-500">
                            {tc.result_summary}
                          </p>
                        </div>
                        {Object.keys(tc.arguments).length > 0 && (
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-950 p-2 text-[10px] text-zinc-400">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ReasoningSection>

              <ReasoningSection
                icon={<Sparkles className="h-4 w-4" />}
                title="Model"
                description="The language model that composed the final response."
              >
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <code className="font-mono text-xs text-zinc-300">
                    {reasoning.model}
                  </code>
                </div>
              </ReasoningSection>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ReasoningSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className="text-emerald-400">{icon}</span>
        <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      </div>
      <p className="mb-3 text-xs text-zinc-500">{description}</p>
      {children}
    </section>
  );
}
