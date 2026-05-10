import { getLatestSnapshot, getSnapshotHistory } from '@/lib/supabase';
import Dashboard from '@/components/Dashboard';

// Revalidate every 5 minutes so the server-rendered snapshot stays fresh
// between cron runs without always hitting Supabase on every request.
export const revalidate = 300;

const DEMO_SNAPSHOT = {
  id: 'demo',
  created_at: new Date().toISOString(),
  narrative_health: 71,
  favorable_count: 247,
  hostile_count: 89,
  news_cycle_temp: 'Moderate' as const,
  issue_areas: [
    { name: 'Healthcare AI',      sentiment: 78, trend: 'up'   as const },
    { name: 'Economic impact',    sentiment: 71, trend: 'up'   as const },
    { name: 'Defense / security', sentiment: 65, trend: 'flat' as const },
    { name: 'AI regulation',      sentiment: 44, trend: 'down' as const },
    { name: 'Data privacy',       sentiment: 38, trend: 'down' as const },
  ],
  sentiment_trend: {
    labels:    ['Apr 29','Apr 30','May 1','May 2','May 3','May 4','May 5'],
    favorable: [201, 210, 218, 225, 230, 238, 247],
    critical:  [84,  79,  77,  82,  80,  85,  89],
  },
  audience_readiness: { generalPublic: 24, stakeholders: 48, policymakers: 57 },
  signals: [
    {
      sentiment: 'Favorable' as const,
      headline:  'Palantir AI credited with improving outcomes at Tampa General — clinical staff testimony surfaces in local news',
      source:    'Reuters Health',
      timeAgo:   '2h ago',
      issueArea: 'Healthcare AI',
      surgeWatch: false,
    },
    {
      sentiment: 'Favorable' as const,
      headline:  'Bipartisan delegation confirmed for Norfolk Navy Shipyard visit — Armed Services staff included',
      source:    'Politico',
      timeAgo:   '5h ago',
      issueArea: 'Defense / security',
      surgeWatch: false,
    },
    {
      sentiment: 'Favorable' as const,
      headline:  'USDA-Palantir partnership expands rural supply chain coverage to 14 additional counties in Mississippi',
      source:    'AP',
      timeAgo:   '8h ago',
      issueArea: 'Economic impact',
      surgeWatch: false,
    },
    {
      sentiment: 'Critical' as const,
      headline:  'Privacy advocates renew scrutiny of Palantir data-sharing practices ahead of House committee hearing',
      source:    'The Intercept',
      timeAgo:   '11h ago',
      issueArea: 'Data privacy',
      surgeWatch: true,
    },
    {
      sentiment: 'Favorable' as const,
      headline:  'Panasonic Gigafactory AI workforce program draws coverage in Reno Gazette — workers featured in story',
      source:    'Reno Gazette-Journal',
      timeAgo:   '14h ago',
      issueArea: 'Economic impact',
      surgeWatch: false,
    },
  ],
  reddit_sentiment: {
    overallScore: 36,
    volumeSignal: 'Normal' as const,
    topThreads: [
      { platform: 'Reddit', summary: 'Palantir quietly expanded its ICE contract — here is what we know', sentiment: 'Critical' as const, url: '' },
      { platform: 'X',      summary: 'Thread on Palantir\'s NHS data deal going viral in UK tech circles', sentiment: 'Critical' as const, url: '' },
      { platform: 'Reddit', summary: 'Is Palantir\'s healthcare AI actually saving lives or just selling a product?', sentiment: 'Neutral' as const, url: '' },
      { platform: 'LinkedIn', summary: 'Former Palantir engineer on the ethical tensions inside the company', sentiment: 'Critical' as const, url: '' },
      { platform: 'Reddit', summary: 'Tampa General says Palantir AI cut sepsis deaths by 30% — anyone seen peer review?', sentiment: 'Favorable' as const, url: '' },
    ],
    issueBreakdown: [
      { name: 'Healthcare AI',      mentions: 6,  sentiment: 58 },
      { name: 'Defense / security', mentions: 8,  sentiment: 45 },
      { name: 'Economic impact',    mentions: 3,  sentiment: 52 },
      { name: 'AI regulation',      mentions: 5,  sentiment: 35 },
      { name: 'Data privacy',       mentions: 11, sentiment: 22 },
    ],
  },
};

export default async function Home() {
  const [latest, history] = await Promise.all([
    getLatestSnapshot(),
    getSnapshotHistory(30),
  ]);

  // Fall back to demo data until the first cron/manual fetch runs
  const snapshot = latest ?? DEMO_SNAPSHOT;
  const snapshots = history.length > 0 ? history : [DEMO_SNAPSHOT];

  return <Dashboard snapshot={snapshot} history={snapshots} />;
}
