import { groq, GROQ_MODEL } from '@/lib/groq/client';
import {
  SMS_PARSE_SYSTEM_PROMPT,
  SMS_PARSE_EXAMPLES,
  type ParsedSms,
  type ParsedSmsError,
} from '@/lib/prompts/sms-parse';

export async function parseSms(
  rawText: string
): Promise<ParsedSms | ParsedSmsError> {
  const messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [
    { role: 'system', content: SMS_PARSE_SYSTEM_PROMPT },
  ];

  for (const ex of SMS_PARSE_EXAMPLES) {
    messages.push({ role: 'user', content: ex.sms });
    messages.push({ role: 'assistant', content: JSON.stringify(ex.expected) });
  }

  messages.push({ role: 'user', content: rawText });

  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.1,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { error: 'empty_response' };

  try {
    const parsed = JSON.parse(content);
    if (parsed.error) return { error: parsed.error };
    return parsed as ParsedSms;
  } catch {
    return { error: 'invalid_json' };
  }
}
