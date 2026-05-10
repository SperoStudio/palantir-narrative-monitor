import { NextRequest, NextResponse } from 'next/server';
import { fetchSentimentFromClaude } from '@/lib/anthropic';
import { fetchRedditPosts, scoreRedditSentiment } from '@/lib/reddit';
import { supabaseServer } from '@/lib/supabase';

type Temp = 'Low' | 'Moderate' | 'High' | 'Critical';
function normalizeTemp(t: string): Temp {
  const v = t.toLowerCase();
  if (v.includes('critical')) return 'Critical';
  if (v.includes('high'))     return 'High';
  if (v.includes('low'))      return 'Low';
  return 'Moderate';
}

// Vercel Cron calls this as GET and includes the heavier social snapshot.
// The main Refresh button calls POST for a faster news-only update; POST
// with ?social=1 runs the full news + social pass on demand.
export const maxDuration = 60;

async function handler(_req: NextRequest) {
  try {
    // Run news + Reddit in parallel — Reddit uses Haiku so both finish in ~25-30s
    const [newsResult, redditResult] = await Promise.allSettled([
      fetchSentimentFromClaude(),
      fetchRedditPosts().then(posts => scoreRedditSentiment(posts)),
    ]);

    if (newsResult.status === 'rejected') throw newsResult.reason;
    const payload = newsResult.value;

    if (redditResult.status === 'rejected') {
      console.warn('[fetch-sentiment] Reddit failed (non-fatal):', redditResult.reason);
    }
    const reddit = redditResult.status === 'fulfilled' ? redditResult.value : null;

    const db = supabaseServer();
    const { error } = await db.from('sentiment_snapshots').insert({
      narrative_health:   payload.narrativeHealth,
      favorable_count:    payload.favorableCount,
      hostile_count:      payload.hostileCount,
      news_cycle_temp:    normalizeTemp(payload.newsCycleTemp),
      issue_areas:        payload.issueAreas,
      sentiment_trend:    payload.sentimentTrend,
      audience_readiness: payload.audienceReadiness,
      signals:            payload.signals,
      reddit_sentiment:   reddit,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, narrativeHealth: payload.narrativeHealth });
  } catch (err) {
    console.error('[fetch-sentiment]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST };
