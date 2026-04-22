// components/thinking-dots.tsx

export function ThinkingDots() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md border border-zinc-800 bg-zinc-900 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:200ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-500 [animation-delay:400ms]" />
        </div>
      </div>
    </div>
  );
}
