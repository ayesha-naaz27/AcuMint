'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Activity, MessageSquare, Settings, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/activity', label: 'Activity', icon: Activity },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/ask', label: 'Ask', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors',
                active
                  ? 'text-emerald-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
