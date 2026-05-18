'use server';

import { getAnalytics, type Period } from '@/lib/db/analytics';

export async function getAnalyticsAction(period: Period, offset: number) {
  return getAnalytics(period, offset);
}
