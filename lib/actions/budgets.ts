'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const BudgetInputSchema = z.object({
  category_id: z.string().uuid(),
  monthly_limit: z.coerce.number().positive('Limit must be greater than zero'),
});

export async function upsertBudget(input: unknown) {
  const parsed = BudgetInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };

  const { error } = await supabase
    .from('budgets')
    .upsert(
      {
        user_id: user.id,
        category_id: parsed.data.category_id,
        monthly_limit: parsed.data.monthly_limit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category_id' }
    );

  if (error) {
    console.error('upsertBudget failed:', error);
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/');
  revalidatePath('/settings');
  return { ok: true as const };
}
