import type { RedditSentiment } from '@/lib/types';

function sentColor(s: number) {
  if (s >= 60) return 'var(--sent-favorable)';
  if (s >= 40) return 'var(--sent-watch)';
  return 'var(--sent-critical)';
}

function volumeBadge(signal: 'Spike' | 'Normal' | 'Quiet') {
  if (signal === 'Spike')  return { bg: 'var(--sent-critical-bg)',  color: 'var(--sent-critical)',  label: '↑ Volume spike' };
  if (signal === 'Normal') return { bg: 'var(--sent-watch-bg)',     color: 'var(--sent-watch)',     label: '→ Normal volume' };
  return                          { bg: 'var(--bg-2)',              color: 'var(--text-3)',         label: '↓ Quiet' };
}

interface Props {
  reddit: RedditSentiment;
}

export default function RedditDiscourse({ reddit }: Props) {
  const badge = volumeBadge(reddit.volumeSignal);

  const criticalCount  = reddit.topThreads.filter(t => t.sentiment === 'Critical').length;
  const favorableCount = reddit.topThreads.filter(t => t.sentiment === 'Favorable').length;

  return (
    <div
      className="panel"
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}
    >
      {/* ── Header spanning all columns ── */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Public discourse
          </span>
          <span className="mono label">Reddit · past 7 days · non-financial</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              background: badge.bg,
              color: badge.color,
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '5px',
              letterSpacing: '0.03em',
            }}
          >
            {badge.label}
          </span>
          <span className="mono label">{reddit.postCount} posts · {reddit.commentVolume.toLocaleString()} comments</span>
        </div>
      </div>

      {/* ── Col 1: Overall sentiment score ── */}
      <div>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Public sentiment
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '38px',
              fontWeight: 700,
              lineHeight: 1,
              color: sentColor(reddit.overallScore),
            }}
          >
            {reddit.overallScore}
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-3)' }}>/100</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--sent-favorable)', background: 'var(--sent-favorable-bg)', padding: '2px 7px', borderRadius: '5px', fontWeight: 600 }}>
            {favorableCount} favorable
          </span>
          <span style={{ fontSize: '11px', color: 'var(--sent-critical)', background: 'var(--sent-critical-bg)', padding: '2px 7px', borderRadius: '5px', fontWeight: 600 }}>
            {criticalCount} critical
          </span>
        </div>

        {/* Issue breakdown */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {reddit.issueBreakdown.map(area => (
            <div key={area.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-2)' }}>{area.name}</span>
                <span style={{ color: sentColor(area.sentiment), fontWeight: 600 }}>
                  {area.mentions}
                  <span style={{ fontWeight: 400, color: 'var(--text-3)', marginLeft: '3px' }}>mentions</span>
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
      </div>

      {/* ── Cols 2–3: Top threads ── */}
      <div style={{ gridColumn: '2 / -1' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Top threads
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {reddit.topThreads.slice(0, 6).map((thread, i) => {
            const isFav  = thread.sentiment === 'Favorable';
            const isCrit = thread.sentiment === 'Critical';
            const badgeBg    = isFav ? 'var(--sent-favorable-bg)' : isCrit ? 'var(--sent-critical-bg)' : 'var(--bg-2)';
            const badgeColor = isFav ? 'var(--sent-favorable)'    : isCrit ? 'var(--sent-critical)'    : 'var(--text-2)';

            return (
              <div
                key={i}
                style={{
                  padding: '8px 0',
                  borderBottom: i < Math.min(reddit.topThreads.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  gap: '9px',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    background: badgeBg,
                    color: badgeColor,
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '5px',
                    minWidth: '60px',
                    textAlign: 'center',
                    marginTop: '1px',
                    flexShrink: 0,
                    letterSpacing: '0.03em',
                  }}
                >
                  {thread.sentiment}
                </span>
                <div style={{ minWidth: 0 }}>
                  <a
                    href={thread.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      lineHeight: 1.4,
                      color: 'var(--text)',
                      textDecoration: 'none',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={thread.title}
                  >
                    {thread.title}
                  </a>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>
                    r/{thread.subreddit} · {thread.engagement.toLocaleString()} engagement
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
