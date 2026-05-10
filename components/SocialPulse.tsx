import type { SocialSentiment } from '@/lib/types';

function sentColor(s: number) {
  if (s >= 60) return 'var(--sent-favorable)';
  if (s >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

function volumeBadge(v: 'Spike' | 'Normal' | 'Quiet') {
  if (v === 'Spike')  return { bg: 'var(--sent-critical-bg)',  color: 'var(--sent-critical)',  label: '↑ Volume spike' };
  if (v === 'Normal') return { bg: 'var(--sent-watch-bg)',     color: 'var(--sent-watch)',     label: '→ Normal volume' };
  return                     { bg: 'var(--bg-2)',              color: 'var(--text-3)',         label: '↓ Quiet' };
}

interface Props {
  social: SocialSentiment | null;
}

export default function SocialPulse({ social }: Props) {
  const badge = volumeBadge(social?.volumeSignal ?? 'Quiet');
  const hasData = !!social && social.topThreads.length > 0;

  return (
    <div className="panel grid-reddit">
      {/* Header */}
      <div
        className="reddit-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Public discourse
          </span>
          <span className="mono label">X · Reddit · LinkedIn · non-financial</span>
        </div>
        <span
          style={{
            background: badge.bg, color: badge.color,
            fontSize: '10px', fontWeight: 600,
            padding: '2px 7px', borderRadius: '5px', letterSpacing: '0.03em',
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Col 1: Score + issue breakdown */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Public sentiment
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '38px', fontWeight: 700, lineHeight: 1, color: sentColor(social?.overallScore ?? 50) }}>
            {social?.overallScore ?? '—'}
          </span>
          {social && <span style={{ fontSize: '14px', color: 'var(--text-3)' }}>/100</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {(social?.issueBreakdown ?? []).map(area => (
            <div key={area.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-2)' }}>{area.name}</span>
                <span style={{ color: sentColor(area.sentiment), fontWeight: 600 }}>
                  {area.mentions}
                  <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: '3px' }}>mentions</span>
                </span>
              </div>
              <div className="pbar">
                <div className="pfill" style={{ width: `${area.sentiment}%`, background: sentColor(area.sentiment) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cols 2–3: Top threads */}
      <div className="reddit-threads">
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Representative posts
        </div>

        {!hasData ? (
          <div style={{ border: '1px dashed var(--border-2)', borderRadius: '8px', padding: '16px', color: 'var(--text-3)', fontSize: '12px', lineHeight: 1.5 }}>
            Social data populates on next Refresh.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {social!.topThreads.slice(0, 5).map((t, i) => {
              const isFav  = t.sentiment === 'Favorable';
              const isCrit = t.sentiment === 'Critical';
              const bg    = isFav ? 'var(--sent-favorable-bg)' : isCrit ? 'var(--sent-critical-bg)' : 'var(--bg-2)';
              const color = isFav ? 'var(--sent-favorable)'    : isCrit ? 'var(--sent-critical)'    : 'var(--text-2)';

              return (
                <div
                  key={i}
                  style={{
                    padding: '8px 0',
                    borderBottom: i < social!.topThreads.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', gap: '9px', alignItems: 'flex-start',
                  }}
                >
                  <span style={{ background: bg, color, fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', minWidth: '60px', textAlign: 'center', marginTop: '1px', flexShrink: 0, letterSpacing: '0.03em' }}>
                    {t.sentiment}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.4, color: 'var(--text)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        title={t.summary}
                      >
                        {t.summary}
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.4, color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.summary}
                      </span>
                    )}
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {t.platform}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
