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

export async function fetchSocialSentiment(): Promise<SocialSentiment> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });
  const today  = new Date().toISOString().slice(0, 10);

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 1500,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools:   [{ type: 'web_search_20250305', name: 'web_search' } as any],
    system:  'Make exactly ONE web search. Return ONLY valid JSON — no markdown, no backticks.',
    messages: [{
      role:    'user',
      content:
        `Search "Palantir public opinion ${today} site:reddit.com OR site:x.com OR site:linkedin.com". ` +
        `Find what non-investor public discourse says about Palantir — privacy concerns, ` +
        `defense contracts, healthcare AI, government data use. Ignore stock price talk.\n\n` +
        `Return ONLY this JSON (replace placeholder values with real findings):\n` +
        `{"overallScore":50,"volumeSignal":"Normal|Spike|Quiet",` +
        `"topThreads":[{"platform":"X or Reddit or LinkedIn","summary":"one sentence","sentiment":"Favorable|Critical|Neutral","url":""}],` +
        `"issueBreakdown":[` +
        `{"name":"Healthcare AI","mentions":0,"sentiment":50},` +
        `{"name":"Defense / security","mentions":0,"sentiment":50},` +
        `{"name":"Economic impact","mentions":0,"sentiment":50},` +
        `{"name":"AI regulation","mentions":0,"sentiment":50},` +
        `{"name":"Data privacy","mentions":0,"sentiment":50}]}\n\n` +
        `Rules: topThreads max 5 items. All sentiment values must be exactly Favorable, Critical, or Neutral. ` +
        `volumeSignal must be exactly Spike, Normal, or Quiet. overallScore is 0-100 where 50=neutral.`,
    }],
  });

  const textBlocks = response.content.filter(b => b.type === 'text');
  const text = (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string })?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Social sentiment response contained no JSON');

  try {
    return JSON.parse(match[0]) as SocialSentiment;
  } catch {
    const cleaned = match[0].replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleaned) as SocialSentiment;
  }
}
