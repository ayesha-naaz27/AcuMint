'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTransaction } from '@/lib/actions/transactions';
import type { Category } from '@/lib/types/database';

const FormSchema = z.object({
  amount: z.string().min(1, 'Required'),
  direction: z.enum(['debit', 'credit']),
  merchant: z.string().min(1, 'Required'),
  category_id: z.string(),
  occurred_at: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

function localDatetimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AddTransactionSheet({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: '',
      direction: 'debit',
      merchant: '',
      category_id: '',
      occurred_at: localDatetimeNow(),
      notes: '',
    },
  });

  const direction = watch('direction');
  const categoryId = watch('category_id');

  function onSubmit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const result = await createTransaction({
        ...values,
        category_id: values.category_id || null,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      reset({
        amount: '',
        direction: 'debit',
        merchant: '',
        category_id: '',
        occurred_at: localDatetimeNow(),
        notes: '',
      });
      setOpen(false);
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Add transaction"
          className="fixed bottom-24 right-[calc(50%-220px)] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg transition-transform hover:bg-emerald-400 active:scale-95"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="mx-auto max-w-[480px] rounded-t-2xl border-zinc-800 bg-zinc-950 p-6"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="text-zinc-100">New transaction</SheetTitle>
          <SheetDescription className="text-zinc-500">
            Enter a transaction manually. More methods coming soon.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue('direction', 'debit')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                direction === 'debit'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              Money out
            </button>
            <button
              type="button"
              onClick={() => setValue('direction', 'credit')}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                direction === 'credit'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400'
              }`}
            >
              Money in
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0"
              className="font-mono text-2xl tabular-nums"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-red-400">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant or description</Label>
            <Input
              id="merchant"
              placeholder="e.g. Swiggy, Metro Card, Rent"
              {...register('merchant')}
            />
            {errors.merchant && (
              <p className="text-xs text-red-400">{errors.merchant.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setValue('category_id', v)}
            >
              <SelectTrigger className="bg-zinc-900">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occurred_at">When</Label>
            <Input
              id="occurred_at"
              type="datetime-local"
              {...register('occurred_at')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Anything worth remembering"
              {...register('notes')}
            />
          </div>

          {serverError && (
            <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save transaction'
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
