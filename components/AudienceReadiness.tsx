import type { AudienceReadiness } from '@/lib/types';

function sentColor(s: number) {
  if (s >= 60) return 'var(--sent-favorable)';
  if (s >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

const ROWS = [
  { key: 'generalPublic' as const, label: 'General public'  },
  { key: 'stakeholders'  as const, label: 'Stakeholders'    },
  { key: 'policymakers'  as const, label: 'Policymakers'    },
];

interface Props {
  readiness: AudienceReadiness;
}

export default function AudienceReadinessPanel({ readiness }: Props) {
  return (
    <div className="panel">
      <div
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: '16px',
          letterSpacing: '0.01em',
        }}
      >
        Audience readiness
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ROWS.map(({ key, label }) => {
          const val = readiness[key];
          return (
            <div key={key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: sentColor(val) }}>
                  {val}%
                </span>
              </div>
              <div className="pbar" style={{ height: '7px' }}>
                <div
                  className="pfill"
                  style={{ width: `${val}%`, background: sentColor(val) }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
