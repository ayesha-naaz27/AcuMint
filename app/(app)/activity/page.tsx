import { getTransactions } from '@/lib/db/transactions';
import { getCategories } from '@/lib/db/categories';
import { ActivityView } from './activity-view';

export default async function ActivityPage() {
  const [transactions, categories] = await Promise.all([
    getTransactions(),
    getCategories(),
  ]);

  return <ActivityView transactions={transactions} categories={categories} />;
}
