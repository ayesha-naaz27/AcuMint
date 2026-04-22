'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { upsertBudget, deleteBudget } from '@/lib/actions/budgets';
import { formatINR } from '@/lib/format';
import type { Category, BudgetWithCategory } from '@/lib/types/database';

export function BudgetManager({
  categories,
  budgets,
}: {
  categories: Category[];
  budgets: BudgetWithCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const usedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter(
    (c) => !usedCategoryIds.has(c.id)
  );

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await upsertBudget({
        category_id: categoryId,
        monthly_limit: limit,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCategoryId('');
      setLimit('');
      setOpen(false);
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteBudget(id);
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Monthly budgets</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-800 bg-zinc-900"
              disabled={availableCategories.length === 0}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="mx-auto max-w-[480px] rounded-t-2xl border-zinc-800 bg-zinc-950 p-6"
          >
            <SheetHeader className="text-left">
              <SheetTitle className="text-zinc-100">New budget</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="bg-zinc-900">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900">
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Monthly limit (₹)</Label>
                <Input
                  id="limit"
                  type="number"
                  inputMode="decimal"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  placeholder="5000"
                  className="font-mono text-2xl tabular-nums"
                />
              </div>

              {error && (
                <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
                  {error}
                </p>
              )}

              <Button
                onClick={save}
                disabled={!categoryId || !limit || isPending}
                className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save budget'
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-center">
          <p className="text-sm text-zinc-500">No budgets yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Set a monthly cap for any category.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {budgets.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: b.category.color ?? '#71717a' }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{b.category.name}</p>
                <p className="font-mono text-xs text-zinc-500 tabular-nums">
                  {formatINR(Number(b.monthly_limit))} / month
                </p>
              </div>
              <button
                aria-label="Delete budget"
                onClick={() => remove(b.id)}
                disabled={isPending}
                className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
