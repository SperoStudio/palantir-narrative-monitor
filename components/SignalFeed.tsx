'use client';

import { useState } from 'react';
import type { Signal } from '@/lib/types';

interface Props {
  signals: Signal[];
  label?: string;
}

function timeAgoToMs(timeAgo: string) {
  const match = timeAgo.toLowerCase().match(/(\d+)\s*(m|min|minute|minutes|h|hr|hour|hours|d|day|days)/);
  if (!match) return Number.MAX_SAFE_INTEGER;

  const value = Number(match[1]);
  const unit = match[2];

  if (unit.startsWith('m')) return value * 60 * 1000;
  if (unit.startsWith('h')) return value * 60 * 60 * 1000;
  if (unit.startsWith('d')) return value * 24 * 60 * 60 * 1000;

  return Number.MAX_SAFE_INTEGER;
}

function signalTime(signal: Signal) {
  if (signal.publishedAt) {
    const parsed = new Date(signal.publishedAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  return Date.now() - timeAgoToMs(signal.timeAgo);
}

export default function SignalFeed({ signals, label = 'Last 24 hours' }: Props) {
  const [view, setView] = useState<'recent' | 'all'>('recent');
  const orderedSignals = [...signals].sort((a, b) => signalTime(b) - signalTime(a));
  const visibleSignals = view === 'recent' ? orderedSignals.slice(0, 10) : orderedSignals;

  return (
    <div className="panel">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          Live signal feed
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono label">{label}</span>
          {orderedSignals.length > 10 && (
            <div
              style={{
                display: 'flex',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              {(['recent', 'all'] as const).map(option => {
                const active = view === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    style={{
                      border: 0,
                      borderRight: option === 'recent' ? '1px solid var(--border)' : 0,
                      background: active ? 'var(--accent-muted)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-3)',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {option === 'recent' ? 'Top 10' : 'All'}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {visibleSignals.map((s, i) => {
          const isFav  = s.sentiment === 'Favorable';
          const isCrit = s.sentiment === 'Critical';

          const badgeBg = isFav
            ? 'var(--sent-favorable-bg)'
            : isCrit
            ? 'var(--sent-critical-bg)'
            : 'var(--bg-2)';
          const badgeColor = isFav
            ? 'var(--sent-favorable)'
            : isCrit
            ? 'var(--sent-critical)'
            : 'var(--text-2)';

          return (
            <div
              key={i}
              className="sig"
              style={{
                padding: '9px 0',
                borderBottom: i < visibleSignals.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  background: badgeBg,
                  color: badgeColor,
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '5px',
                  minWidth: '64px',
                  textAlign: 'center',
                  marginTop: '1px',
                  flexShrink: 0,
                  letterSpacing: '0.03em',
                }}
              >
                {s.sentiment}
              </span>

              <div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    lineHeight: 1.45,
                    color: 'var(--text)',
                  }}
                >
                  {s.headline}
                </div>
                <div
                  className="mono"
                  style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}
                >
                  {s.source} · {s.timeAgo} · {s.issueArea}
                  {s.surgeWatch && (
                    <span style={{ color: 'var(--sent-watch)', marginLeft: '4px' }}>
                      · Surge watch
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
