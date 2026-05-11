import Anthropic from '@anthropic-ai/sdk';

export interface SocialThread {
  platform: string;
  summary:  string;
  sentiment: 'Favorable' | 'Critical' | 'Neutral';
  url: string;
}

export interface SocialSentiment {
  overallScore:   number;
  volumeSignal:   'Spike' | 'Normal' | 'Quiet';
  topThreads:     SocialThread[];
  issueBreakdown: { name: string; mentions: number; sentiment: number }[];
}

export const EMPTY_SOCIAL: SocialSentiment = {
  overallScore: 50,
  volumeSignal: 'Quiet',
  topThreads:   [],
  issueBreakdown: [
    { name: 'Healthcare AI',      mentions: 0, sentiment: 50 },
    { name: 'Defense / security', mentions: 0, sentiment: 50 },
    { name: 'Economic impact',    mentions: 0, sentiment: 50 },
    { name: 'AI regulation',      mentions: 0, sentiment: 50 },
    { name: 'Data privacy',       mentions: 0, sentiment: 50 },
  ],
};

const SYSTEM_PROMPT =
  'You are a public opinion analyst for Palantir Technologies. ' +
  'Make exactly ONE web search to find recent public discourse about Palantir on Reddit, X, LinkedIn, and forums. ' +
  'Do not make multiple searches. Use only what that one search returns. ' +
  'Return ONLY a raw JSON object. No markdown. No code blocks. No explanation. Just the JSON.';

const today = () => new Date().toISOString().slice(0, 10);

const USER_PROMPT = () =>
  `Search "Palantir public opinion Reddit X LinkedIn ${today()}" — one search only. ` +
  `Find what the general public (non-investors) say about Palantir: privacy concerns, ` +
  `government contracts, healthcare AI, defense work. Ignore stock commentary.\n\n` +
  `Return ONLY this JSON (fill in real data from search results):\n` +
  `{"overallScore":50,"volumeSignal":"Normal",` +
  `"topThreads":[{"platform":"Reddit","summary":"one sentence","sentiment":"Neutral","url":""}],` +
  `"issueBreakdown":[` +
  `{"name":"Healthcare AI","mentions":0,"sentiment":50},` +
  `{"name":"Defense / security","mentions":0,"sentiment":50},` +
  `{"name":"Economic impact","mentions":0,"sentiment":50},` +
  `{"name":"AI regulation","mentions":0,"sentiment":50},` +
  `{"name":"Data privacy","mentions":0,"sentiment":50}]}\n\n` +
  `Rules: topThreads max 5 items. platform must be one of Reddit, X, LinkedIn, or Forum. ` +
  `sentiment values must be exactly Favorable, Critical, or Neutral. ` +
  `volumeSignal must be exactly Spike, Normal, or Quiet. ` +
  `overallScore is 0-100 where 50=neutral, lower=more critical.`;

export async function fetchSocialSentiment(): Promise<SocialSentiment> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0, timeout: 55000 });

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools:   [{ type: 'web_search_20250305', name: 'web_search' } as any],
    system:  SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT() }],
  });

  const textBlocks = response.content.filter(b => b.type === 'text');
  const text = (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string })?.text ?? '';

  if (!text) {
    console.warn('[social] No text block in response. stop_reason:', response.stop_reason,
      '— content types:', response.content.map(b => b.type).join(', '));
    throw new Error('Social sentiment response had no text block');
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.warn('[social] No JSON in text block. Raw text (first 500 chars):', text.slice(0, 500));
    throw new Error('Social sentiment response contained no JSON');
  }

  try {
    return JSON.parse(match[0]) as SocialSentiment;
  } catch {
    const cleaned = match[0].replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned) as SocialSentiment;
  }
}
