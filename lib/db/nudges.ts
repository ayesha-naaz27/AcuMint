// lib/db/nudges.ts
import { createClient } from '@/lib/supabase/server';

export type Nudge = {
  id: string;
  user_id: string;
  kind: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
};

export async function getActiveNudges(): Promise<Nudge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('nudges')
    .select('*')
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('getActiveNudges failed:', error);
    return [];
  }
  return (data ?? []) as Nudge[];
}
