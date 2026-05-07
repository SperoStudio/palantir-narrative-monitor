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
        generalPublic: '<0-100>',
        stakeholders:  '<0-100>',
        policymakers:  '<0-100>',
      },
      signals: [
        {
          sentiment:  'Favorable or Critical or Neutral',
          headline:   '<real headline>',
          source:     '<publication>',
          timeAgo:    '<Xh ago>',
          issueArea:  '<area>',
          surgeWatch: '<bool>',
        },
      ],
    })
  );
};

export async function fetchSentimentFromClaude(): Promise<AnthropicPayload> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT() }],
  });

  const textBlocks = response.content.filter((b) => b.type === 'text');
  const raw = (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string })?.text ?? '';

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude response contained no JSON object');

  return JSON.parse(match[0]) as AnthropicPayload;
}
