import { groq, GROQ_MODEL } from '@/lib/groq/client';
import { createClient } from '@/lib/supabase/server';
import { embed } from '@/lib/embeddings/embed';
import { TOOL_SCHEMAS, executeTool } from './tools';
import { formatINR } from '@/lib/format';

const SYSTEM_PROMPT = `You are FinSight, a personal finance assistant for an Indian user.

You have access to four tools: query_transactions, calculate_budget_health, forecast_spending, detect_recurring. Call them as needed to answer the user's question accurately.

Important rules:
1. Always ground your answers in the user's real data. Never invent numbers.
2. Format all money amounts as Indian rupees with Indian comma grouping (e.g. "₹12,450").
3. Be concise. Two to four sentences is ideal. Longer only when the user asks for detail.
4. If the user asks a question that needs data you cannot get from the tools, say so plainly.
5. If you are asked something personal but not finance-related, politely redirect.
6. Never mention the tools by name in your response. Speak naturally.`;

export type ReasoningTrace = {
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

export type AgentResponse = {
  answer: string;
  reasoning: ReasoningTrace;
};

export async function runAgent(userQuestion: string): Promise<AgentResponse> {
  const supabase = await createClient();

  // Step 1: RAG retrieval
  const queryEmbedding = await embed(userQuestion);
  const { data: matches, error: matchErr } = await supabase.rpc(
    'match_transactions',
    { query_embedding: queryEmbedding as unknown as string, match_count: 5 }
  );
  if (matchErr) console.error('match_transactions failed:', matchErr);

  const retrieved = (matches ?? []) as Array<{
    merchant: string | null;
    amount: number;
    direction: string;
    occurred_at: string;
    similarity: number;
  }>;

  const retrievedContext =
    retrieved.length > 0
      ? `Here are the ${retrieved.length} transactions most semantically similar to the user's question (for context; you may still want to query more):\n` +
        retrieved
          .map(
            (r, i) =>
              `${i + 1}. ${r.merchant ?? 'Unknown'} — ${r.direction === 'debit' ? '−' : '+'}${formatINR(Number(r.amount))} on ${r.occurred_at.slice(0, 10)}`
          )
          .join('\n')
      : 'No specifically relevant past transactions found for this question.';

  // Step 2: Agent loop with tools
  const messages: Array<{
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | null;
    tool_calls?: Array<{
      id: string;
      type: 'function';
      function: { name: string; arguments: string };
    }>;
    tool_call_id?: string;
    name?: string;
  }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: retrievedContext },
    { role: 'user', content: userQuestion },
  ];

  const toolCallTrace: ReasoningTrace['tool_calls'] = [];
  let rounds = 0;
  const MAX_ROUNDS = 4;

  while (rounds < MAX_ROUNDS) {
    rounds++;
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: messages as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: TOOL_SCHEMAS as any,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 800,
    });

    const msg = response.choices[0]?.message;
    if (!msg) break;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return {
        answer: msg.content ?? 'Sorry, I could not produce an answer.',
        reasoning: {
          retrieved_transactions: retrieved,
          tool_calls: toolCallTrace,
          model: GROQ_MODEL,
          rounds,
        },
      };
    }

    messages.push({
      role: 'assistant',
      content: msg.content ?? null,
      tool_calls: msg.tool_calls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })),
    });

    for (const tc of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments);
      } catch {
        // malformed args — tool sees {}
      }
      const result = await executeTool(tc.function.name, args);
      toolCallTrace.push({
        tool: tc.function.name,
        arguments: args,
        result_summary: summarizeToolResult(tc.function.name, result),
      });
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        name: tc.function.name,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    answer:
      "I was working on your question but hit my reasoning limit. Could you rephrase or simplify?",
    reasoning: {
      retrieved_transactions: retrieved,
      tool_calls: toolCallTrace,
      model: GROQ_MODEL,
      rounds,
    },
  };
}

function summarizeToolResult(toolName: string, result: unknown): string {
  if (
    typeof result !== 'object' ||
    result === null ||
    !('ok' in result) ||
    !(result as { ok: boolean }).ok
  ) {
    return 'Tool call failed.';
  }
  const data = (result as { data: unknown }).data;
  if (toolName === 'query_transactions' && typeof data === 'object' && data) {
    return `Found ${(data as { count: number }).count} transaction(s).`;
  }
  if (toolName === 'calculate_budget_health' && typeof data === 'object' && data) {
    return `Evaluated ${(data as { count: number }).count} budget(s).`;
  }
  if (toolName === 'forecast_spending' && typeof data === 'object' && data) {
    const d = data as { projected_month_end: number; category: string };
    return `Projected ${d.category} spend this month: ₹${d.projected_month_end.toLocaleString('en-IN')}.`;
  }
  if (toolName === 'detect_recurring' && typeof data === 'object' && data) {
    return `Detected ${(data as { count: number }).count} recurring merchant(s).`;
  }
  return 'Tool call completed.';
}
