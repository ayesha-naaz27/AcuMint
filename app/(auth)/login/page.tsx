'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-mono text-4xl font-semibold text-emerald-500">
          AcuMint
        </h1>
        <p className="text-xs text-zinc-500">
          An AI-Based Personal Finance Assistant Using Retrieval-Augmented Generation for Indian Users
        </p>
        <p className="text-sm text-zinc-400">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            minLength={6}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-emerald-500 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
