'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { runAgent } from '@/lib/agent/run';

export async function sendChatMessage(userText: string) {
  const text = userText.trim();
  if (text.length < 2) {
    return { ok: false as const, error: 'Message is too short' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: 'Not signed in' };

  const { error: userMsgErr } = await supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'user',
    content: text,
  });
  if (userMsgErr) {
    return { ok: false as const, error: userMsgErr.message };
  }

  let response;
  try {
    response = await runAgent(text);
  } catch (e) {
    console.error('runAgent failed:', e);
    return { ok: false as const, error: 'Agent failed to respond' };
  }

  const { error: botMsgErr } = await supabase.from('chat_messages').insert({
    user_id: user.id,
    role: 'assistant',
    content: response.answer,
    reasoning: response.reasoning,
  });
  if (botMsgErr) {
    return { ok: false as const, error: botMsgErr.message };
  }

  revalidatePath('/ask');
  return { ok: true as const, answer: response.answer, reasoning: response.reasoning };
}
