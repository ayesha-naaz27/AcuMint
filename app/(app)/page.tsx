import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="p-6 space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-zinc-400">Good evening</p>
        <h1 className="text-2xl font-semibold">
          {user?.email?.split('@')[0] ?? 'there'}
        </h1>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Spent this month
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tabular-nums">
          ₹0
        </p>
      </section>

      <p className="text-sm text-zinc-500">
        Home dashboard — coming in Day 2.
      </p>
    </main>
  );
}
