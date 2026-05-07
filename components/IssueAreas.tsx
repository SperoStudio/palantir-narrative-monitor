import type { IssueArea } from '@/lib/types';

function sentColor(s: number) {
  if (s >= 60) return 'var(--sent-favorable)';
  if (s >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

function trendIcon(t: string) {
  if (t === 'up')   return '↑';
  if (t === 'down') return '↓';
  return '→';
}

interface Props {
  issueAreas: IssueArea[];
}

export default function IssueAreas({ issueAreas }: Props) {
  const lowest = issueAreas.length
    ? issueAreas.reduce((m, a) => (a.sentiment < m.sentiment ? a : m), issueAreas[0])
    : null;

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '14px',
          letterSpacing: '0.01em',
        }}
      >
        Issue area sentiment
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {issueAreas.map((area) => (
          <div key={area.name}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                marginBottom: '2px',
              }}
            >
              <span style={{ color: 'var(--text-2)' }}>{area.name}</span>
              <span style={{ fontWeight: 600, color: sentColor(area.sentiment) }}>
                <span style={{ fontSize: '10px', marginRight: '2px', opacity: 0.8 }}>
                  {trendIcon(area.trend)}
                </span>
                {area.sentiment}%
              </span>
            </div>
            <div className="pbar">
              <div
                className="pfill"
                style={{ width: `${area.sentiment}%`, background: sentColor(area.sentiment) }}
              />
            </div>
          </div>
        ))}
      </div>

      {lowest && lowest.sentiment < 50 && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
            ⚑ {lowest.name}: priority watch area. Surge content ready.
          </div>
        </div>
      )}
    </div>
  );
}
