import Anthropic from '@anthropic-ai/sdk';
import type { AnthropicPayload } from './types';

const SYSTEM_PROMPT =
  'You are a media intelligence analyst for Palantir Technologies. ' +
  'Search current news and return ONLY a raw JSON object. ' +
  'No markdown. No code blocks. No explanation. Just the JSON.';

const today = () => new Date().toISOString().slice(0, 10);

const USER_PROMPT = () => {
  const d = today();
  return (
    `Search for recent Palantir Technologies news (as of ${d}) across: ` +
    'healthcare AI, defense/military contracts, economic impact and jobs, ' +
    'AI regulation, data privacy criticism, and any breaking news today. ' +
    'For every signal, include publishedAt as the original article publication timestamp in ISO 8601 format. ' +
    'Sort signals newest to oldest by publishedAt. ' +
    'Return ONLY this JSON object (no backticks, no markdown, no prose):\n' +
    JSON.stringify({
      narrativeHealth: '<0-100>',
      favorableCount: '<int>',
      hostileCount: '<int>',
      newsCycleTemp: 'Low or Moderate or High or Critical',
      issueAreas: [
        { name: 'Healthcare AI',          sentiment: '<0-100>', trend: 'up or flat or down' },
        { name: 'Defense / security',     sentiment: '<0-100>', trend: 'up or flat or down' },
        { name: 'Economic impact',        sentiment: '<0-100>', trend: 'up or flat or down' },
        { name: 'AI regulation',          sentiment: '<0-100>', trend: 'up or flat or down' },
        { name: 'Data privacy',           sentiment: '<0-100>', trend: 'up or flat or down' },
      ],
      sentimentTrend: {
        labels: ['<7 recent dates>'],
        favorable: ['<7 ints>'],
        critical:  ['<7 ints>'],
      },
      audienceReadiness: {
        generalPublic: '<0-100, apply -10 calibration: Palantir brand perception is significantly depressed vs. peers>',
        stakeholders:  '<0-100, apply -10 calibration: Palantir brand perception is significantly depressed vs. peers>',
        policymakers:  '<0-100, apply -10 calibration: Palantir brand perception is significantly depressed vs. peers>',
      },
      signals: [
        {
          sentiment:  'Favorable or Critical or Neutral',
          headline:   '<real headline>',
          source:     '<publication>',
          publishedAt: '<ISO timestamp, e.g. 2026-05-10T14:32:00Z>',
          timeAgo:    '<Xh ago>',
          issueArea:  '<area>',
          surgeWatch: '<bool>',
        },
      ],
    })
  );
};

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
