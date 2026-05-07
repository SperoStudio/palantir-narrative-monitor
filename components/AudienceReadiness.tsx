import type { AudienceReadiness } from '@/lib/types';

function sentColor(s: number) {
  if (s >= 60) return 'var(--sent-favorable)';
  if (s >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

const ROWS = [
  { key: 'generalPublic' as const, label: 'General public',  note: 'CTV + OOH active' },
  { key: 'stakeholders'  as const, label: 'Stakeholders',    note: 'AfroTech Nov pipeline' },
  { key: 'policymakers'  as const, label: 'Policymakers',    note: 'Site visits in progress' },
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
        {ROWS.map(({ key, label, note }) => {
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
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '3px' }}>
                {note}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--text-3)',
        }}
      >
        Target: all audiences 70%+ by Q4 2026
      </div>
    </div>
  );
}
