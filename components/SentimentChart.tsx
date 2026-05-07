'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { SentimentSnapshot } from '@/lib/types';

interface Props {
  snapshots: SentimentSnapshot[];
}

export default function SentimentChart({ snapshots }: Props) {
  const data = snapshots.map((s) => {
    const date = new Date(s.created_at);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return {
      label,
      Favorable: s.favorable_count,
      Critical:  s.hostile_count,
    };
  });

  const tickStyle = { fontSize: 10, fontFamily: 'monospace', fill: 'var(--text-3)' };

  return (
    <div className="panel">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
          Narrative sentiment trend
        </span>
        <span className="mono label">Historical · all snapshots</span>
      </div>

      <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', fontSize: '11px', color: 'var(--text-2)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '2px', background: '#1D9E75', display: 'inline-block', borderRadius: '1px' }} />
          Favorable
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '12px', height: '0', borderTop: '2px dashed #E24B4A', display: 'inline-block' }} />
          Critical
        </span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="label"
            tick={tickStyle}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={tickStyle} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg-4)',
              border: '1px solid var(--border-2)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          />
          <Legend wrapperStyle={{ display: 'none' }} />
          <Line
            type="monotone"
            dataKey="Favorable"
            stroke="#1D9E75"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Critical"
            stroke="#E24B4A"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
