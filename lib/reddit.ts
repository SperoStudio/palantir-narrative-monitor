import Anthropic from '@anthropic-ai/sdk';

// Subreddits that are primarily about stock trading — skipped because we
// want public narrative sentiment, not investor sentiment.
const FINANCIAL_SUBS = new Set([
  'palantir', 'pltr', 'stocks', 'investing', 'wallstreetbets',
  'options', 'stockmarket', 'finance', 'pennystocks', 'robinhood',
  'thetagang', 'dividends', 'valueinvesting', 'etfs', 'algotrading',
  'securityanalysis', 'personalfinance', 'financialindependence',
]);

export interface RedditPost {
  title: string;
  subreddit: string;
  score: number;
  numComments: number;
  url: string;
  createdUtc: number;
}

export interface RedditThread {
  title: string;
  platform?: 'Reddit' | 'X / Public Web';
  source?: string;
  subreddit?: string;
  sentiment: 'Favorable' | 'Critical' | 'Neutral';
  engagement: number;
  url: string;
  coverage?: 'Measured' | 'Limited public web';
}

export interface RedditSentiment {
  overallScore: number;
  postCount: number;
  commentVolume: number;
  volumeSignal: 'Spike' | 'Normal' | 'Quiet';
  xMentionCount?: number;
  platformBreakdown?: {
    platform: 'Reddit' | 'X / Public Web';
    sentiment: number;
    volume: number;
    coverage: 'Measured' | 'Limited public web';
  }[];
  topThreads: RedditThread[];
  issueBreakdown: {
    name: string;
    mentions: number;
    sentiment: number;
  }[];
}

export async function fetchRedditPosts(): Promise<RedditPost[]> {
  const queries = [
    'palantir privacy',
    'palantir surveillance',
    'palantir ICE',
    'palantir defense AI',
    'palantir NHS',
    'palantir healthcare AI',
    'palantir data sharing',
  ];

  const results = await Promise.allSettled(
    queries.map(async query => {
      const res = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=month&limit=25&type=link`,
        {
          headers: {
            'User-Agent': 'PalantirNarrativeMonitor/1.0 (public narrative intelligence tool)',
          },
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        throw new Error(`Reddit API returned ${res.status} for ${query}`);
      }

      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.data.children.map((child: any) => ({
        title: child.data.title,
        subreddit: child.data.subreddit,
        score: child.data.score,
        numComments: child.data.num_comments,
        url: `https://reddit.com${child.data.permalink}`,
        createdUtc: child.data.created_utc,
      })) as RedditPost[];
    })
  );

  const posts = results.flatMap(result => (result.status === 'fulfilled' ? result.value : []));
  const uniquePosts = Array.from(new Map(posts.map(post => [post.url, post])).values());

  // Remove financial/stock subreddits — we only want public opinion
  return uniquePosts.filter(p => !FINANCIAL_SUBS.has(p.subreddit.toLowerCase()));
}

export async function scoreRedditSentiment(posts: RedditPost[]): Promise<RedditSentiment> {
  const commentVolume = posts.reduce((sum, p) => sum + p.numComments, 0);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const postsText = posts
    .slice(0, 40)
    .map(
      p =>
        `[r/${p.subreddit}] ${p.title} — ${p.score} upvotes, ${p.numComments} comments — ${p.url}`
    )
    .join('\n') || 'No usable non-financial Reddit posts were found from public Reddit search.';

  const prompt =
    'You are a public-opinion analyst. Analyze public social-media narrative sentiment about Palantir Technologies, not investor sentiment. ' +
    'Use the Reddit posts below as measured public-discourse inputs from non-financial communities. ' +
    'Also use web search to find representative, publicly indexed X/Twitter posts or public-web references to X discourse about Palantir across privacy, ICE/immigration, defense AI, healthcare AI, NHS, government data sharing, and AI regulation. ' +
    'If Reddit is sparse, still produce a useful X / Public Web snapshot from publicly indexed sources. ' +
    'Exclude stock-price, earnings, trading, and $PLTR investor chatter. Treat X as limited public-web coverage, not complete platform coverage.\n\n' +
    'Posts:\n' +
    postsText +
    '\n\nReturn ONLY this JSON object (no backticks, no markdown, no prose):\n' +
    JSON.stringify({
      overallScore: '<0-100, where 50 = neutral public opinion>',
      postCount: posts.length,
      commentVolume,
      volumeSignal: 'Spike or Normal or Quiet',
      xMentionCount: '<number of representative X/public-web mentions found; 0 if none>',
      platformBreakdown: [
        {
          platform: 'Reddit',
          sentiment: '<0-100>',
          volume: posts.length,
          coverage: 'Measured',
        },
        {
          platform: 'X / Public Web',
          sentiment: '<0-100>',
          volume: '<representative public-web mention count; do not imply firehose coverage>',
          coverage: 'Limited public web',
        },
      ],
      topThreads: [
        {
          platform: 'Reddit or X / Public Web',
          source: '<subreddit name, X handle, or publication/reference source>',
          subreddit: '<subreddit name when platform is Reddit; otherwise omit or empty string>',
          title: '<post title, post paraphrase, or public-web X discourse summary, max 100 chars>',
          sentiment: 'Favorable or Critical or Neutral',
          engagement: '<score + numComments for Reddit, or visible engagement/0 for X public-web>',
          url: '<full source url>',
          coverage: 'Measured or Limited public web',
        },
      ],
      issueBreakdown: [
        { name: 'Healthcare AI',      mentions: '<int>', sentiment: '<0-100>' },
        { name: 'Defense / security', mentions: '<int>', sentiment: '<0-100>' },
        { name: 'Economic impact',    mentions: '<int>', sentiment: '<0-100>' },
        { name: 'AI regulation',      mentions: '<int>', sentiment: '<0-100>' },
        { name: 'Data privacy',       mentions: '<int>', sentiment: '<0-100>' },
      ],
    });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlocks = response.content.filter((b) => b.type === 'text');
  const text = (textBlocks[textBlocks.length - 1] as { type: 'text'; text: string })?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Reddit sentiment response contained no JSON');

  try {
    return JSON.parse(match[0]) as RedditSentiment;
  } catch {
    // Response was likely truncated — strip trailing incomplete element and retry
    const cleaned = match[0]
      .replace(/,\s*$/, '')           // trailing comma at end
      .replace(/,\s*([}\]])/g, '$1'); // comma before closing bracket
    return JSON.parse(cleaned) as RedditSentiment;
  }
}
