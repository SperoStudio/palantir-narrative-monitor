import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Narrative Environment Monitor — Palantir',
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
          <span
            style={{
              fontWeight: 700,
              fontSize: '13px',
              letterSpacing: '0.06em',
              color: 'var(--accent)',
              textTransform: 'lowercase',
            }}
          >
            spero studio
          </span>

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
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '9.5px',
                fontWeight: 600,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '2px',
                  background: 'var(--accent)',
                  borderRadius: '1px',
                }}
              />
              Client engagement
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--text)',
                letterSpacing: '0.01em',
              }}
            >
              Narrative Environment Monitor
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
