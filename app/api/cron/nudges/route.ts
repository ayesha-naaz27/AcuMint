// app/api/cron/nudges/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { generateNudgesForAllUsers } from '@/lib/nudges/generate';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await generateNudgesForAllUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('cron/nudges failed:', e);
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}
