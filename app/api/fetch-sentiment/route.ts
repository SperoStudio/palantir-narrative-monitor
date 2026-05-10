import { NextRequest, NextResponse } from 'next/server';
import { fetchSentimentFromClaude } from '@/lib/anthropic';
import { fetchSocialSentiment } from '@/lib/social';
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
    // Run news + social in parallel — both use web search so finish together
    const [newsResult, socialResult] = await Promise.allSettled([
      fetchSentimentFromClaude(),
      fetchSocialSentiment(),
    ]);

    if (newsResult.status === 'rejected') throw newsResult.reason;
    const payload = newsResult.value;

    if (socialResult.status === 'rejected') {
      console.warn('[fetch-sentiment] Social fetch failed (non-fatal):', socialResult.reason);
    }
    const reddit = socialResult.status === 'fulfilled' ? socialResult.value : null;

    const db = supabaseServer();
    // .select() forces PostgREST to return the inserted row, which surfaces
    // errors that supabase-js v2 otherwise silently swallows on certain
    // failure modes (RLS denials, missing columns, etc.).
    const insertResult = await db.from('sentiment_snapshots').insert({
      narrative_health:   payload.narrativeHealth,
      favorable_count:    payload.favorableCount,
      hostile_count:      payload.hostileCount,
      news_cycle_temp:    normalizeTemp(payload.newsCycleTemp),
      issue_areas:        payload.issueAreas,
      sentiment_trend:    payload.sentimentTrend,
      audience_readiness: payload.audienceReadiness,
      signals:            payload.signals,
      reddit_sentiment:   reddit,
    }).select();

    if (insertResult.error) throw new Error(insertResult.error.message);
    if (!insertResult.data?.length) {
      throw new Error('Insert returned no data — likely RLS denial or missing column. Check Supabase.');
    }

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
