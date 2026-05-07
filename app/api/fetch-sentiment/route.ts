import { NextRequest, NextResponse } from 'next/server';
import { fetchSentimentFromClaude } from '@/lib/anthropic';
import { supabaseServer } from '@/lib/supabase';

// Vercel Cron calls this as GET; the Refresh button calls it as POST.
// Both paths run the same logic.
export const maxDuration = 60;

async function handler(_req: NextRequest) {
  // Verify cron secret when called by Vercel Cron scheduler
  const authHeader = _req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await fetchSentimentFromClaude();

    const db = supabaseServer();
    const { error } = await db.from('sentiment_snapshots').insert({
      narrative_health:  payload.narrativeHealth,
      favorable_count:   payload.favorableCount,
      hostile_count:     payload.hostileCount,
      news_cycle_temp:   payload.newsCycleTemp,
      issue_areas:       payload.issueAreas,
      sentiment_trend:   payload.sentimentTrend,
      audience_readiness: payload.audienceReadiness,
      signals:           payload.signals,
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
