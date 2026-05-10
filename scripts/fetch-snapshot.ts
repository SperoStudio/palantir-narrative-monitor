// Standalone snapshot fetcher — same logic as /api/fetch-sentiment but
// runs outside of Next.js / Vercel, so there is no 60-second function
// timeout ceiling. Run this locally or from GitHub Actions.
//
// Usage (local):
//   npm run fetch
//   — or —
//   npx tsx scripts/fetch-snapshot.ts
//
// Required env vars (loaded automatically from .env.local locally;
// in GitHub Actions they come from repository Secrets):
//   ANTHROPIC_API_KEY
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY

import dotenv from 'dotenv';
import path   from 'path';
// Resolve .env.local relative to project root (parent of this scripts/ dir).
// override:false means existing process.env values win, keeping CI correct.
// override:true so the .env.local key wins even if the var is already exported
// as an empty string in the shell. In CI the file doesn't exist so dotenv
// no-ops silently and the Actions Secrets (set before the step) stay intact.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

import { fetchSentimentFromClaude } from '../lib/anthropic';
import { fetchSocialSentiment }     from '../lib/social';
import { supabaseServer }           from '../lib/supabase';

type Temp = 'Low' | 'Moderate' | 'High' | 'Critical';
function normalizeTemp(t: string): Temp {
  const v = t.toLowerCase();
  if (v.includes('critical')) return 'Critical';
  if (v.includes('high'))     return 'High';
  if (v.includes('low'))      return 'Low';
  return 'Moderate';
}

async function main() {
  const start   = Date.now();
  const elapsed = () => `${((Date.now() - start) / 1000).toFixed(1)}s`;

  console.log(`[fetch-snapshot] starting at ${new Date().toISOString()}`);

  // News + social run in parallel — both are Claude web-search calls.
  const [newsResult, socialResult] = await Promise.allSettled([
    fetchSentimentFromClaude(),
    fetchSocialSentiment(),
  ]);

  if (newsResult.status === 'rejected') throw newsResult.reason;
  const payload = newsResult.value;
  console.log(`[fetch-snapshot] news done (${elapsed()}) — health=${payload.narrativeHealth}, signals=${payload.signals.length}`);

  if (socialResult.status === 'rejected') {
    console.warn('[fetch-snapshot] social fetch failed (non-fatal):', socialResult.reason);
  }
  const social = socialResult.status === 'fulfilled' ? socialResult.value : null;
  if (social) {
    console.log(`[fetch-snapshot] social done (${elapsed()}) — score=${social.overallScore}, threads=${social.topThreads.length}`);
  }

  const db = supabaseServer();
  const { data, error } = await db
    .from('sentiment_snapshots')
    .insert({
      narrative_health:   payload.narrativeHealth,
      favorable_count:    payload.favorableCount,
      hostile_count:      payload.hostileCount,
      news_cycle_temp:    normalizeTemp(payload.newsCycleTemp),
      issue_areas:        payload.issueAreas,
      sentiment_trend:    payload.sentimentTrend,
      audience_readiness: payload.audienceReadiness,
      signals:            payload.signals,
      reddit_sentiment:   social,
    })
    .select();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  if (!data?.length) throw new Error('Supabase insert returned no rows — check RLS / missing column');

  console.log(`[fetch-snapshot] inserted snapshot ${data[0].id} (total ${elapsed()})`);
}

main().catch(err => {
  console.error('[fetch-snapshot] FAILED:', err);
  process.exit(1);
});
