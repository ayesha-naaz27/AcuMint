// app/(app)/ask/page.tsx
import { getChatHistory } from '@/lib/db/chat';
import { AskView } from './ask-view';

export const dynamic = 'force-dynamic';

export default async function AskPage() {
  const history = await getChatHistory();
  return <AskView initialHistory={history} />;
}
