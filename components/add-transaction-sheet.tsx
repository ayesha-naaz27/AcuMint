'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Loader2,
  Edit3,
  MessageSquareText,
  FileText,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
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
import { ingestSms } from '@/lib/actions/sms';
import { formatINR } from '@/lib/format';
import type { Category } from '@/lib/types/database';

type Mode = 'menu' | 'manual' | 'sms';

export function AddTransactionSheet({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('menu');

  function reset() {
    setMode('menu');
  }

  function close() {
    setOpen(false);
    setTimeout(reset, 300);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setTimeout(reset, 300);
      }}
    >
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
        {mode === 'menu' && <MenuView setMode={setMode} />}
        {mode === 'manual' && (
          <ManualView
            categories={categories}
            onBack={() => setMode('menu')}
            onDone={close}
          />
        )}
        {mode === 'sms' && (
          <SmsView onBack={() => setMode('menu')} onDone={close} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuView({ setMode }: { setMode: (m: Mode) => void }) {
  return (
    <>
      <SheetHeader className="text-left">
        <SheetTitle className="text-zinc-100">Add transaction</SheetTitle>
        <SheetDescription className="text-zinc-500">
          How would you like to add it?
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-2">
        <MenuItem
          icon={<Edit3 className="h-5 w-5" />}
          label="Add manually"
          description="Type in the details yourself"
          onClick={() => setMode('manual')}
        />
        <MenuItem
          icon={<MessageSquareText className="h-5 w-5" />}
          label="Paste bank SMS"
          description="Let AI extract amount, merchant, category"
          onClick={() => setMode('sms')}
        />
        <MenuItem
          icon={<FileText className="h-5 w-5" />}
          label="Upload PDF statement"
          description="Coming soon"
          disabled
        />
      </div>
    </>
  );
}

function MenuItem({
  icon,
  label,
  description,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-left transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-emerald-400">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-zinc-100">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
    </button>
  );
}

const ManualSchema = z.object({
  amount: z.string().min(1, 'Required'),
  direction: z.enum(['debit', 'credit']),
  merchant: z.string().min(1, 'Required'),
  category_id: z.string(),
  occurred_at: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
type ManualValues = z.infer<typeof ManualSchema>;

function localDatetimeNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ManualView({
  categories,
  onBack,
  onDone,
}: {
  categories: Category[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ManualValues>({
    resolver: zodResolver(ManualSchema),
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

  function onSubmit(values: ManualValues) {
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
      onDone();
    });
  }

  return (
    <>
      <SheetHeader className="text-left">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SheetTitle className="text-zinc-100">New transaction</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue('direction', 'debit')}
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
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
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
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
          <Label htmlFor="merchant">Merchant</Label>
          <Input id="merchant" placeholder="e.g. Swiggy" {...register('merchant')} />
          {errors.merchant && (
            <p className="text-xs text-red-400">{errors.merchant.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={(v) => setValue('category_id', v)}>
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
          <Input id="occurred_at" type="datetime-local" {...register('occurred_at')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={2} {...register('notes')} />
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
    </>
  );
}

function SmsView({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    amount: number;
    merchant: string;
    direction: string;
    category: string;
  } | null>(null);

  function submit() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await ingestSms(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(result.parsed);
      setTimeout(onDone, 1600);
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <p className="text-sm text-zinc-400">Added</p>
        <p className="mt-1 font-mono text-2xl tabular-nums">
          {success.direction === 'credit' ? '+' : '−'}
          {formatINR(success.amount)}
        </p>
        <p className="mt-1 text-sm text-zinc-300">{success.merchant}</p>
        <p className="mt-2 text-xs text-zinc-500">{success.category}</p>
      </div>
    );
  }

  return (
    <>
      <SheetHeader className="text-left">
        <button
          onClick={onBack}
          className="mb-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
        <SheetTitle className="text-zinc-100">Paste bank SMS</SheetTitle>
        <SheetDescription className="text-zinc-500">
          Paste the full SMS text from HDFC, SBI, ICICI, Axis, Kotak, or any UPI app.
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <Textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Rs.450.00 debited from a/c **4532 on 22-Apr-26 at SWIGGY BANGALORE..."
          className="font-mono text-xs"
        />

        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          onClick={submit}
          disabled={!text.trim() || isPending}
          className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Extracting...
            </>
          ) : (
            'Extract and save'
          )}
        </Button>

        <p className="text-center text-xs text-zinc-600">
          Your SMS is sent to our LLM for parsing and stored alongside the transaction.
        </p>
      </div>
    </>
  );
}
