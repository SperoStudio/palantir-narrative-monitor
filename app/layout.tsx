import type { Metadata } from 'next';
import Image from 'next/image';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Public Sentiment Monitor — Palantir',
  description: 'Real-time narrative sentiment dashboard powered by Palantir · Spero Studio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif' }}>
        <header
          style={{
            background: 'var(--bg-2)',
            borderBottom: '1px solid var(--border)',
            padding: '0 1.5rem',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <Image
            src="/spero-studio-logo.png"
            alt="Spero Studio"
            width={128}
            height={30}
            style={{
              width: '112px',
              height: 'auto',
              display: 'block',
            }}
            priority
          />

          <span
            style={{
              width: '1px',
              height: '16px',
              background: 'var(--border-2)',
              flexShrink: 0,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text)',
                letterSpacing: '0.01em',
              }}
            >
              Public Sentiment Monitor
            </span>
          </div>

          <div className="hide-mobile" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-3)',
              }}
            >
              Palantir Technologies
            </span>
          </div>
        </header>

        <main className="page-main" style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
