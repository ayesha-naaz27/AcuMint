// lib/actions/nudges.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateNudgesForCurrentUser } from '@/lib/nudges/generate';

export async function dismissNudge(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('nudges')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath('/');
  return { ok: true as const };
}

export async function runNudgeGenerationNow() {
  try {
    const nudges = await generateNudgesForCurrentUser();
    revalidatePath('/');
    return { ok: true as const, count: nudges.length };
  } catch (e) {
    return { ok: false as const, error: String(e) };
  }
}
