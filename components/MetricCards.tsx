import type { SentimentSnapshot } from '@/lib/types';

function sentColor(score: number) {
  if (score >= 60) return 'var(--sent-favorable)';
  if (score >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

function tempColor(temp: string) {
  if (temp === 'Low')     return 'var(--green)';
  if (temp === 'Moderate') return 'var(--amber)';
  return 'var(--red)';
}

interface Props {
  snapshot: SentimentSnapshot;
}

export default function MetricCards({ snapshot }: Props) {
  const { narrative_health: nh, favorable_count: fc, hostile_count: hc, news_cycle_temp: temp } = snapshot;
  const pct = Math.round((fc / Math.max(fc + hc, 1)) * 100);

  return (
    <div className="grid-metrics">
      {/* Narrative health */}
      <div className="card">
        <div className="label" style={{ marginBottom: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '2px', background: 'var(--accent)', borderRadius: '1px', marginRight: '5px', verticalAlign: 'middle' }} />
          Narrative health index
        </div>
        <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1, color: sentColor(nh) }}>
          {nh}
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-3)', marginLeft: '2px' }}>/100</span>
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: sentColor(nh) }}>
          {nh >= 65 ? 'Favorable environment' : nh >= 45 ? 'Mixed environment' : 'Challenging environment'}
        </div>
      </div>

      {/* Favorable signals */}
      <div className="card">
        <div className="label" style={{ marginBottom: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '2px', background: 'var(--accent)', borderRadius: '1px', marginRight: '5px', verticalAlign: 'middle' }} />
          Favorable signals
        </div>
        <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1, color: 'var(--text)' }}>
          {fc}
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: 'var(--text-2)' }}>
          vs. {hc} hostile ·{' '}
          <span style={{ color: 'var(--sent-favorable)', fontWeight: 500 }}>{pct}% favorable</span>
        </div>
      </div>

      {/* News cycle temperature */}
      <div className="card">
        <div className="label" style={{ marginBottom: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '2px', background: 'var(--accent)', borderRadius: '1px', marginRight: '5px', verticalAlign: 'middle' }} />
          News cycle temperature
        </div>
        <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1, color: tempColor(temp) }}>
          {temp}
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: 'var(--text-2)' }}>
          {temp === 'Critical' ? 'Surge advised now' : temp === 'High' ? 'Surge on standby' : 'Monitoring active'}
        </div>
      </div>

      {/* Surge reserve */}
      <div className="card">
        <div className="label" style={{ marginBottom: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '2px', background: 'var(--accent)', borderRadius: '1px', marginRight: '5px', verticalAlign: 'middle' }} />
          Surge reserve
        </div>
        <div style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1, color: 'var(--green)' }}>
          Ready
        </div>
        <div style={{ fontSize: '11px', marginTop: '5px', color: 'var(--text-2)' }}>
          Deployable in &lt;48h
        </div>
      </div>
    </div>
  );
}
