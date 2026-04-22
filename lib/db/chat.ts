// lib/db/chat.ts
import { createClient } from '@/lib/supabase/server';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning: ChatReasoning | null;
  created_at: string;
};

export type ChatReasoning = {
  retrieved_transactions: Array<{
    merchant: string | null;
    amount: number;
    direction: string;
    occurred_at: string;
    similarity: number;
  }>;
  tool_calls: Array<{
    tool: string;
    arguments: Record<string, unknown>;
    result_summary: string;
  }>;
  model: string;
  rounds: number;
};

export async function getChatHistory(limit = 50): Promise<ChatMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, reasoning, created_at')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('getChatHistory failed:', error);
    return [];
  }
  return (data ?? []) as ChatMessage[];
}
