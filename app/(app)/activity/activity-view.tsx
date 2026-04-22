'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { TransactionRow } from '@/components/transaction-row';
import { AddTransactionSheet } from '@/components/add-transaction-sheet';
import { CategoryPie } from '@/components/charts/category-pie';
import { DailySpendLine } from '@/components/charts/daily-spend-line';
import type { TransactionWithCategory, Category } from '@/lib/types/database';

export function ActivityView({
  transactions,
  categories,
}: {
  transactions: TransactionWithCategory[];
  categories: Category[];
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return transactions;
    const q = query.toLowerCase();
    return transactions.filter((t) => {
      return (
        t.merchant?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.category?.name.toLowerCase().includes(q)
      );
    });
  }, [transactions, query]);

  return (
    <main className="space-y-6 p-6 pb-28">
      <h1 className="text-2xl font-semibold">Activity</h1>

      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <CategoryPie transactions={transactions} />
          <DailySpendLine transactions={transactions} />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search merchant, notes, category..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No transactions match &ldquo;{query}&rdquo;
              </p>
            ) : (
              filtered.map((t) => <TransactionRow key={t.id} txn={t} />)
            )}
          </div>
        </>
      )}

      <AddTransactionSheet categories={categories} />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
      <p className="text-zinc-400">No transactions yet.</p>
      <p className="mt-1 text-sm text-zinc-500">
        Tap the + button to add your first one.
      </p>
    </div>
  );
}
