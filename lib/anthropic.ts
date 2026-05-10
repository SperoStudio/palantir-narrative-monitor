import Anthropic from '@anthropic-ai/sdk';
import type { AnthropicPayload } from './types';

const SYSTEM_PROMPT =
  'You are a media intelligence analyst for Palantir Technologies focused on NON-FINANCIAL narrative risk. ' +
  'Make exactly ONE web search using a single broad query to gather current Palantir news. ' +
  'Do not make multiple searches. Use only what that one search returns. ' +
  'EXCLUDE entirely: stock price, earnings, revenue, analyst ratings, market cap, share price, ' +
  'investment thesis, trading, financial performance, Wall Street, investor day, quarterly results. ' +
  'INCLUDE only: civil liberties concerns, government surveillance criticism, defense contract controversies, ' +
  'data privacy issues, healthcare data ethics, immigration enforcement involvement, employee culture, ' +
  'political controversy, public accountability, journalism investigations, regulatory scrutiny. ' +
  'Return ONLY a raw JSON object. No markdown. No code blocks. No explanation. Just the JSON.';

const today = () => new Date().toISOString().slice(0, 10);

const USER_PROMPT = () =>
  `Search "Palantir Technologies controversy criticism privacy ${today()}" — one search only. ` +
  'Score NON-FINANCIAL narrative sentiment only. Skip any signal about stock, earnings, or investors. Return ONLY valid JSON, no markdown:\n' +
  '{"narrativeHealth":50,"favorableCount":0,"hostileCount":0,"newsCycleTemp":"Low|Moderate|High|Critical",' +
  '"issueAreas":[' +
    '{"name":"Healthcare AI","sentiment":50,"trend":"flat"},' +
    '{"name":"Defense / security","sentiment":50,"trend":"flat"},' +
    '{"name":"Economic impact","sentiment":50,"trend":"flat"},' +
    '{"name":"AI regulation","sentiment":50,"trend":"flat"},' +
    '{"name":"Data privacy","sentiment":50,"trend":"flat"}],' +
  '"sentimentTrend":{"labels":["d1","d2","d3","d4","d5","d6","d7"],"favorable":[0,0,0,0,0,0,0],"critical":[0,0,0,0,0,0,0]},' +
  '"audienceReadiness":{"generalPublic":50,"stakeholders":50,"policymakers":50},' +
  '"signals":[{"sentiment":"Neutral","headline":"headline","source":"source","timeAgo":"1h ago","issueArea":"area","surgeWatch":false}]}' +
  '\nReplace all placeholder values with real scored data from the search results. ' +
  'Apply -10 point calibration to audienceReadiness scores — Palantir brand perception is depressed vs peers.';

export async function fetchSentimentFromClaude(): Promise<AnthropicPayload> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT() }],
  });

  const textBlocks = response.content.filter((b) => b.type === 'text');
  const raw = (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string })?.text ?? '';

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude response contained no JSON object');

  try {
    return JSON.parse(match[0]) as AnthropicPayload;
  } catch {
    // Strip trailing commas left by a truncated response and retry once
    const cleaned = match[0].replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned) as AnthropicPayload;
  }
}
