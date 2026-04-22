import { createClient } from '@/lib/supabase/server';
import { embed, buildTransactionEmbeddingText } from '@/lib/embeddings/embed';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 });
  }

  const { data: txns, error } = await supabase
    .from('transactions')
    .select(`
      id, amount, direction, merchant, notes,
      category:categories(name)
    `)
    .is('embedding', null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  let updated = 0;
  let failed = 0;

  for (const t of txns ?? []) {
    try {
      const text = buildTransactionEmbeddingText({
        merchant: t.merchant,
        notes: t.notes,
        direction: t.direction as 'debit' | 'credit',
        amount: Number(t.amount),
        category_name: (t.category as { name: string } | null)?.name ?? null,
      });
      const vec = await embed(text);
      const { error: updateErr } = await supabase
        .from('transactions')
        .update({ embedding: vec as unknown as string })
        .eq('id', t.id);
      if (updateErr) {
        console.error('Update failed for', t.id, updateErr);
        failed++;
      } else {
        updated++;
      }
    } catch (e) {
      console.error('Embedding failed for', t.id, e);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, updated, failed, total: txns?.length ?? 0 });
}
