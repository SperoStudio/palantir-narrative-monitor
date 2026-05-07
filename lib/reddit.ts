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
  const res = await fetch(
    'https://www.reddit.com/search.json?q=palantir&sort=new&t=week&limit=100&type=link',
    {
      headers: {
        'User-Agent': 'PalantirNarrativeMonitor/1.0 (narrative intelligence tool)',
      },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error(`Reddit API returned ${res.status}`);
  }

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const posts: RedditPost[] = data.data.children.map((child: any) => ({
    title: child.data.title,
    subreddit: child.data.subreddit,
    score: child.data.score,
    numComments: child.data.num_comments,
    url: `https://reddit.com${child.data.permalink}`,
    createdUtc: child.data.created_utc,
  }));

  // Remove financial/stock subreddits — we only want public opinion
  return posts.filter(p => !FINANCIAL_SUBS.has(p.subreddit.toLowerCase()));
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const postsText = posts
    .slice(0, 40)
    .map(
      p =>
        `[r/${p.subreddit}] ${p.title} — ${p.score} upvotes, ${p.numComments} comments — ${p.url}`
    )
    .join('\n');

  const prompt =
    'You are a public-opinion analyst. The posts below are from Reddit about Palantir Technologies ' +
    '— sourced from non-financial communities (technology, privacy, politics, worldnews, etc.) ' +
    'from the past week. Analyze public narrative sentiment, not investor sentiment.\n\n' +
    'Posts:\n' +
    postsText +
    '\n\nReturn ONLY this JSON object (no backticks, no markdown, no prose):\n' +
    JSON.stringify({
      overallScore: '<0-100, where 50 = neutral public opinion>',
      postCount: posts.length,
      commentVolume,
      volumeSignal: 'Spike or Normal or Quiet',
      topThreads: [
        {
          title: '<post title, max 80 chars>',
          subreddit: '<subreddit name>',
          sentiment: 'Favorable or Critical or Neutral',
          engagement: '<score + numComments as integer>',
          url: '<full reddit url>',
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
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = (response.content[0] as { type: 'text'; text: string })?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Reddit sentiment response contained no JSON');

  return JSON.parse(match[0]) as RedditSentiment;
}
