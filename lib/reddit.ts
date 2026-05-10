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
  subreddit: string;
  sentiment: 'Favorable' | 'Critical' | 'Neutral';
  engagement: number;
  url: string;
}

export interface RedditSentiment {
  overallScore: number;
  postCount: number;
  commentVolume: number;
  volumeSignal: 'Spike' | 'Normal' | 'Quiet';
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

  if (posts.length === 0) {
    return {
      overallScore: 50,
      postCount: 0,
      commentVolume: 0,
      volumeSignal: 'Quiet',
      topThreads: [],
      issueBreakdown: [
        { name: 'Healthcare AI',      mentions: 0, sentiment: 50 },
        { name: 'Defense / security', mentions: 0, sentiment: 50 },
        { name: 'Economic impact',    mentions: 0, sentiment: 50 },
        { name: 'AI regulation',      mentions: 0, sentiment: 50 },
        { name: 'Data privacy',       mentions: 0, sentiment: 50 },
      ],
    };
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 0 });

  // Send only the fields Claude needs to analyze — no raw URLs which can
  // contain unescaped characters that corrupt JSON output.
  const postsText = posts
    .slice(0, 40)
    .map((p, i) =>
      `${i + 1}. [r/${p.subreddit}] ${p.title} | upvotes:${p.score} comments:${p.numComments}`
    )
    .join('\n');

  const prompt =
    'You are a public-opinion analyst. Score the narrative sentiment in these Reddit posts about ' +
    'Palantir Technologies. These come from non-financial communities — focus on public perception ' +
    'of privacy, defense contracts, healthcare AI, immigration enforcement, and AI regulation. ' +
    'Ignore stock price or investor sentiment.\n\n' +
    'Posts:\n' + postsText + '\n\n' +
    'Return ONLY valid JSON. No markdown, no backticks, no commentary. ' +
    'For topThreads, use ONLY the post titles exactly as written above — do not add or invent content. ' +
    'Limit topThreads to 6 items maximum.\n\n' +
    JSON.stringify({
      overallScore: 50,
      postCount: posts.length,
      commentVolume,
      volumeSignal: 'Spike or Normal or Quiet',
      topThreads: [
        {
          title:      '<exact post title from list above, truncated to 80 chars>',
          subreddit:  '<subreddit>',
          sentiment:  'Favorable or Critical or Neutral',
          engagement: 0,
          url:        '',
        },
      ],
      issueBreakdown: [
        { name: 'Healthcare AI',      mentions: 0, sentiment: 50 },
        { name: 'Defense / security', mentions: 0, sentiment: 50 },
        { name: 'Economic impact',    mentions: 0, sentiment: 50 },
        { name: 'AI regulation',      mentions: 0, sentiment: 50 },
        { name: 'Data privacy',       mentions: 0, sentiment: 50 },
      ],
    });

  const response = await client.messages.create({
    model:      'claude-haiku-4-5',
    max_tokens: 2000,
    messages:   [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: 'text'; text: string })?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Reddit sentiment response contained no JSON');

  // Re-attach the real URLs now that JSON is safely parsed
  const result = JSON.parse(match[0]) as RedditSentiment;
  const urlMap = new Map(posts.map(p => [p.title.slice(0, 80), p.url]));
  result.topThreads = result.topThreads.map(t => ({
    ...t,
    url: urlMap.get(t.title) ?? urlMap.get(t.title.slice(0, 80)) ?? '',
  }));

  return result;
}
