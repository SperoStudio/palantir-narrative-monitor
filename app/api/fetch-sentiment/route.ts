import { NextRequest, NextResponse } from 'next/server';
import { fetchSentimentFromClaude } from '@/lib/anthropic';
import { fetchRedditPosts, scoreRedditSentiment } from '@/lib/reddit';
import { supabaseServer } from '@/lib/supabase';

// Vercel Cron calls this as GET and includes the heavier social snapshot.
// The main Refresh button calls POST for a faster news-only update; POST
// with ?social=1 runs the full news + social pass on demand.
export const maxDuration = 60;

async function handler(_req: NextRequest) {
  try {
    const includeSocial =
      _req.method === 'GET' || _req.nextUrl.searchParams.get('social') === '1';
    const socialOnly =
      _req.method === 'POST' && _req.nextUrl.searchParams.get('social') === '1';

    const db = supabaseServer();

    if (socialOnly) {
      const reddit = await fetchRedditPosts().then(posts => scoreRedditSentiment(posts));
      const { data: latest, error: latestError } = await db
        .from('sentiment_snapshots')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) throw new Error(latestError.message);
      if (!latest?.id) throw new Error('No sentiment snapshot exists to attach social data to');

      const { error } = await db
        .from('sentiment_snapshots')
        .update({ reddit_sentiment: reddit })
        .eq('id', latest.id);

      if (error) throw new Error(error.message);

      return NextResponse.json({
        ok: true,
        socialOnly: true,
        socialIncluded: true,
        postCount: reddit.postCount,
      });
    }

    const payload = await fetchSentimentFromClaude();
    let reddit = null;

    if (includeSocial) {
      try {
        reddit = await fetchRedditPosts().then(posts => scoreRedditSentiment(posts));
      } catch (err) {
        console.warn('[fetch-sentiment] Social fetch failed:', err);
      }
    } else {
      const { data } = await db
        .from('sentiment_snapshots')
        .select('reddit_sentiment')
        .not('reddit_sentiment', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      reddit = data?.reddit_sentiment ?? null;
    }

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

    return NextResponse.json({
      ok: true,
      narrativeHealth: payload.narrativeHealth,
      socialIncluded: includeSocial,
    });
  } catch (err) {
    console.error('[fetch-sentiment]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export { handler as GET, handler as POST };
