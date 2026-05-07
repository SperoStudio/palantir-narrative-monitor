export interface IssueArea {
  name: string;
  sentiment: number;
  trend: 'up' | 'flat' | 'down';
}

export interface SentimentTrend {
  labels: string[];
  favorable: number[];
  critical: number[];
}

export interface AudienceReadiness {
  generalPublic: number;
  stakeholders: number;
  policymakers: number;
}

export interface Signal {
  sentiment: 'Favorable' | 'Critical' | 'Neutral';
  headline: string;
  source: string;
  timeAgo: string;
  issueArea: string;
  surgeWatch: boolean;
}

export interface SentimentSnapshot {
  id: string;
  created_at: string;
  narrative_health: number;
  favorable_count: number;
  hostile_count: number;
  news_cycle_temp: 'Low' | 'Moderate' | 'High' | 'Critical';
  issue_areas: IssueArea[];
  sentiment_trend: SentimentTrend;
  audience_readiness: AudienceReadiness;
  signals: Signal[];
}

export interface AnthropicPayload {
  narrativeHealth: number;
  favorableCount: number;
  hostileCount: number;
  newsCycleTemp: 'Low' | 'Moderate' | 'High' | 'Critical';
  issueAreas: IssueArea[];
  sentimentTrend: SentimentTrend;
  audienceReadiness: AudienceReadiness;
  signals: Signal[];
}
