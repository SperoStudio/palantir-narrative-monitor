'use client';

import { useState, useTransition } from 'react';
import type { SentimentSnapshot } from '@/lib/types';
import MetricCards from './MetricCards';
import SentimentChart from './SentimentChart';
import IssueAreas from './IssueAreas';
import AudienceReadiness from './AudienceReadiness';
import SignalFeed from './SignalFeed';
import RedditDiscourse from './RedditDiscourse';
import { useRouter } from 'next/navigation';

interface Props {
  snapshot: SentimentSnapshot;
  history: SentimentSnapshot[];
}

const EMPTY_SOCIAL_SNAPSHOT = {
  overallScore: 50,
  postCount: 0,
  commentVolume: 0,
  volumeSignal: 'Quiet' as const,
  xMentionCount: 0,
  platformBreakdown: [
    {
      platform: 'Reddit' as const,
      sentiment: 50,
      volume: 0,
      coverage: 'Measured' as const,
    },
    {
      platform: 'X / Public Web' as const,
      sentiment: 50,
      volume: 0,
      coverage: 'Limited public web' as const,
    },
  ],
  topThreads: [],
  issueBreakdown: [
    { name: 'Healthcare AI',      mentions: 0, sentiment: 50 },
    { name: 'Defense / security', mentions: 0, sentiment: 50 },
    { name: 'Economic impact',    mentions: 0, sentiment: 50 },
    { name: 'AI regulation',      mentions: 0, sentiment: 50 },
    { name: 'Data privacy',       mentions: 0, sentiment: 50 },
  ],
};

export default function Dashboard({ snapshot, history }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingSocial, setIsRefreshingSocial] = useState(false);
  const socialSnapshot = snapshot.reddit_sentiment ?? EMPTY_SOCIAL_SNAPSHOT;

  const updatedAt = new Date(snapshot.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });

  async function handleRefresh(includeSocial = false) {
    if (includeSocial) setIsRefreshingSocial(true);
    else setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch(
        includeSocial ? '/api/fetch-sentiment?social=1' : '/api/fetch-sentiment',
        { method: 'POST' }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      if (includeSocial) setIsRefreshingSocial(false);
      else setIsRefreshing(false);
    }
  }

  return (
    <div style={{ paddingTop: '0.25rem' }}>
      {/* Header bar */}
      <div
        className="dash-header"
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
            Public sentiment monitor
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

        <div className="dash-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {refreshError && (
            <span style={{ fontSize: '11px', color: 'var(--red)' }}>{refreshError}</span>
          )}
          <span className="mono" style={{ fontSize: '10px', color: 'var(--text-3)' }}>
            Updated {updatedAt} EST
          </span>
          <button
            className="rbtn"
            onClick={() => handleRefresh(false)}
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
      <div className="grid-chart-issues">
        <SentimentChart snapshots={history} />
        <IssueAreas issueAreas={snapshot.issue_areas} />
      </div>

      {/* Audience/social scores + Signal feed */}
      <div className="grid-audience-signals">
        <div className="audience-social-stack">
          <AudienceReadiness readiness={snapshot.audience_readiness} />
          <RedditDiscourse
            reddit={socialSnapshot}
            variant="scores"
            onRefreshSocial={() => handleRefresh(true)}
            isRefreshingSocial={isRefreshingSocial}
          />
        </div>
        <SignalFeed signals={snapshot.signals} />
      </div>

      <RedditDiscourse reddit={socialSnapshot} variant="posts" />
    </div>
  );
}
