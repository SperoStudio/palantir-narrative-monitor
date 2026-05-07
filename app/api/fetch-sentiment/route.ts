import { NextRequest, NextResponse } from 'next/server';
import { fetchSentimentFromClaude } from '@/lib/anthropic';
import { fetchRedditPosts, scoreRedditSentiment } from '@/lib/reddit';
import { supabaseServer } from '@/lib/supabase';

// Vercel Cron calls this as GET; the Refresh button calls it as POST.
// Both paths run the same logic.
export const maxDuration = 60;

async function handler(_req: NextRequest) {
  try {
    // Run news fetch and Reddit fetch in parallel — if Reddit fails we still
    // save the news snapshot; reddit_sentiment will just be null.
    const [newsResult, redditResult] = await Promise.allSettled([
      fetchSentimentFromClaude(),
      fetchRedditPosts().then(posts => scoreRedditSentiment(posts)),
    ]);

    if (newsResult.status === 'rejected') throw newsResult.reason;
    const payload = newsResult.value;

    if (redditResult.status === 'rejected') {
      console.warn('[fetch-sentiment] Reddit fetch failed:', redditResult.reason);
    }
    const reddit = redditResult.status === 'fulfilled' ? redditResult.value : null;

    const db = supabaseServer();
    const { error } = await db.from('sentiment_snapshots').insert({
      narrative_health:   payload.narrativeHealth,
      favorable_count:    payload.favorableCount,
      hostile_count:      payload.hostileCount,
      news_cycle_temp:    payload.newsCycleTemp,
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
