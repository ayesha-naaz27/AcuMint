// app/(app)/settings/page.tsx
import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/lib/db/categories';
import { getBudgets } from '@/lib/db/budgets';
import { Button } from '@/components/ui/button';
import { BudgetManager } from './budget-manager';
import { GenerateNudgeButton } from './generate-nudge-button';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [categories, budgets] = await Promise.all([
    getCategories(),
    getBudgets(),
  ]);

  return (
    <main className="space-y-6 p-6 pb-28">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-1">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Signed in as
        </p>
        <p className="font-mono text-sm">{user?.email}</p>
      </section>

      <BudgetManager categories={categories} budgets={budgets} />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Nudges</h2>
        <GenerateNudgeButton />
        <p className="text-xs text-zinc-600">
          Nudges are also generated automatically at 7:30 AM IST daily.
        </p>
      </section>

      <section>
        <form action="/auth/signout" method="post">
          <Button
            type="submit"
            variant="outline"
            className="w-full border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
          >
            Sign out
          </Button>
        </form>
      </section>
    </main>
  );
}
