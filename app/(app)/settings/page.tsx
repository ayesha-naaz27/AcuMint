import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/lib/db/categories';
import { getBudgets } from '@/lib/db/budgets';
import { Button } from '@/components/ui/button';
import { BudgetManager } from './budget-manager';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [categories, budgets] = await Promise.all([
    getCategories(),
    getBudgets(),
  ]);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-1">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Signed in as
        </p>
        <p className="font-mono text-sm">{user?.email}</p>
      </section>

      <BudgetManager categories={categories} budgets={budgets} />

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
