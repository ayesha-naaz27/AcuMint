// app/(app)/ask/ask-view.tsx
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatBubble } from '@/components/chat-bubble';
import { ThinkingDots } from '@/components/thinking-dots';
import { sendChatMessage } from '@/lib/actions/chat';
import type { ChatMessage } from '@/lib/db/chat';

const SUGGESTED_PROMPTS = [
  'Where did my money go this month?',
  'Am I on track with my budgets?',
  'What are my recurring payments?',
];

export function AskView({ initialHistory }: { initialHistory: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom when messages change or thinking starts
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isPending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;
    setError(null);
    setInput('');

    // Optimistic: show the user's message immediately
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      reasoning: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);

    startTransition(async () => {
      const result = await sendChatMessage(trimmed);
      if (!result.ok) {
        setError(result.error);
        // Roll back the optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
        return;
      }

      // Replace optimistic with real + append assistant response
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        reasoning: result.reasoning,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const isEmpty = messages.length === 0 && !isPending;

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col">
      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto px-6 pt-6">
        {isEmpty ? (
          <EmptyState onPick={(p) => send(p)} />
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {isPending && <ThinkingDots />}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mb-2 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-zinc-800 bg-zinc-950 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] mb-16">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask about your money..."
            className="min-h-[44px] resize-none bg-zinc-900"
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || isPending}
            size="icon"
            aria-label="Send"
            className="h-11 w-11 flex-shrink-0 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" strokeWidth={2.5} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 pb-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
        <Sparkles className="h-6 w-6 text-emerald-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-100">
          Ask about your money
        </h2>
        <p className="max-w-xs text-sm text-zinc-500">
          I know every transaction you&apos;ve recorded. Try one of these:
        </p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        {SUGGESTED_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-300 transition-colors hover:border-emerald-900/60 hover:bg-zinc-800 hover:text-emerald-400"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
