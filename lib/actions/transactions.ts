'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const TransactionInputSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  direction: z.enum(['debit', 'credit']),
  merchant: z.string().trim().min(1, 'Merchant is required').max(120),
  category_id: z.string().uuid().nullable(),
  occurred_at: z.string().min(1, 'Date is required'),
  notes: z.string().trim().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof TransactionInputSchema>;

export async function createTransaction(input: unknown) {
  const parsed = TransactionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: 'Not signed in' };
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount: parsed.data.amount,
    direction: parsed.data.direction,
    merchant: parsed.data.merchant,
    category_id: parsed.data.category_id,
    occurred_at: new Date(parsed.data.occurred_at).toISOString(),
    notes: parsed.data.notes || null,
    source: 'manual',
  });

  if (error) {
    console.error('createTransaction failed:', error);
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/activity');

  return { ok: true as const };
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/');
  revalidatePath('/activity');
  return { ok: true as const };
}
