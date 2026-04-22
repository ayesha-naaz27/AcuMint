import { createClient } from '@/lib/supabase/server';
import { getTransactions, getCurrentMonthSpend } from '@/lib/db/transactions';
import { getCategories } from '@/lib/db/categories';
import { TransactionRow } from '@/components/transaction-row';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { formatINR } from '@/lib/format';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [monthSpend, recent, categories] = await Promise.all([
    getCurrentMonthSpend(),
    getTransactions(5),
    getCategories(),
  ]);

  const emailPrefix = user?.email?.split('@')[0] ?? 'there';

  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-sm text-zinc-400">{greeting()}</p>
        <h1 className="text-2xl font-semibold">{emailPrefix}</h1>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Spent this month
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tabular-nums">
          {formatINR(monthSpend)}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Recent</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center">
            <p className="text-sm text-zinc-500">No transactions yet.</p>
            <p className="mt-1 text-xs text-zinc-600">
              Tap + to add your first one.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <TransactionRow key={t.id} txn={t} />
            ))}
          </div>
        )}
      </section>

      <AddTransactionSheet categories={categories} />
    </main>
  );
}
