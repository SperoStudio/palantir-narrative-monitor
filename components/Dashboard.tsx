'use client';

import { useState, useTransition } from 'react';
import type { SentimentSnapshot } from '@/lib/types';
import MetricCards from './MetricCards';
import SentimentChart from './SentimentChart';
import IssueAreas from './IssueAreas';
import AudienceReadiness from './AudienceReadiness';
import SignalFeed from './SignalFeed';
import { useRouter } from 'next/navigation';

interface Props {
  snapshot: SentimentSnapshot;
  history: SentimentSnapshot[];
}

export default function Dashboard({ snapshot, history }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updatedAt = new Date(snapshot.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch('/api/fetch-sentiment', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div style={{ paddingTop: '0.25rem' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.125rem',
          paddingBottom: '0.875rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="live-dot" />
          <span
            className="mono"
            style={{
              fontSize: '11px',
              color: 'var(--text-2)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Narrative environment monitor
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '5px',
              background: 'var(--sent-favorable-bg)',
              color: 'var(--sent-favorable)',
              letterSpacing: '0.04em',
              marginLeft: '2px',
            }}
          >
            Live
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {refreshError && (
            <span style={{ fontSize: '11px', color: 'var(--red)' }}>{refreshError}</span>
          )}
          <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>
            Updated {updatedAt} EST
          </span>
          <button
            className="rbtn"
            onClick={handleRefresh}
            disabled={isRefreshing || isPending}
            aria-label="Refresh dashboard"
          >
            <span
              style={{ fontSize: '12px' }}
              className={isRefreshing || isPending ? 'spin' : undefined}
            >
              ↻
            </span>
            {isRefreshing || isPending ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Top metric cards */}
      <MetricCards snapshot={snapshot} />

      {/* Sentiment trend + Issue areas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '12px',
          marginBottom: '12px',
        }}
      >
        <SentimentChart snapshots={history} />
        <IssueAreas issueAreas={snapshot.issue_areas} />
      </div>

      {/* Audience readiness + Signal feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
        <AudienceReadiness readiness={snapshot.audience_readiness} />
        <SignalFeed signals={snapshot.signals} />
      </div>
    </div>
  );
}
