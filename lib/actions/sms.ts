'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parseSms } from '@/lib/llm/parse-sms';
import { getCategories } from '@/lib/db/categories';
import { embed, buildTransactionEmbeddingText } from '@/lib/embeddings/embed';

export async function ingestSms(rawText: string) {
  const text = rawText.trim();
  if (text.length < 10) {
    return { ok: false as const, error: 'SMS text is too short' };
  }

  const parsed = await parseSms(text);
  if ('error' in parsed) {
    if (parsed.error === 'not_a_transaction') {
      return {
        ok: false as const,
        error: "That doesn't look like a transaction SMS.",
      };
    }
    return {
      ok: false as const,
      error: 'Could not parse that SMS. Try manual entry?',
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };

  const categories = await getCategories();
  const matched = categories.find(
    (c) => c.name.toLowerCase() === parsed.category_hint.toLowerCase()
  );
  const category_id = matched?.id ?? null;

  let embedding: number[] | null = null;
  try {
    const embText = buildTransactionEmbeddingText({
      merchant: parsed.merchant,
      notes: null,
      direction: parsed.direction,
      amount: parsed.amount,
      category_name: matched?.name ?? null,
    });
    embedding = await embed(embText);
  } catch (e) {
    console.warn('Embedding failed on SMS ingest:', e);
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount: parsed.amount,
    direction: parsed.direction,
    merchant: parsed.merchant,
    account_last4: parsed.account_last4,
    category_id,
    occurred_at: parsed.occurred_at ?? new Date().toISOString(),
    source: 'sms',
    raw_text: text,
    embedding: embedding as unknown as string | null,
  });

  if (error) {
    console.error('ingestSms insert failed:', error);
    return { ok: false as const, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/activity');
  return {
    ok: true as const,
    parsed: {
      amount: parsed.amount,
      merchant: parsed.merchant,
      direction: parsed.direction,
      category: matched?.name ?? parsed.category_hint,
    },
  };
}
