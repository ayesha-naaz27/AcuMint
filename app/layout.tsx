// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinSight',
  description: 'Your agentic personal finance decision engine',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinSight',
  },
  icons: {
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-zinc-950 text-zinc-100 antialiased min-h-dvh`}
      >
        <div className="mx-auto max-w-[480px] min-h-dvh">
          {children}
        </div>
      </body>
    </html>
  );
}
