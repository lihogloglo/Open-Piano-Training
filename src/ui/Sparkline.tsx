import { tr } from '@/i18n';
/** Tiny trend line for rating history (05 §Progress). Flat when there's one point. */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  label,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
  label?: string;
}) {
  if (values.length === 0) {
    return (
      <svg width={width} height={height} role="img" aria-label={label ?? tr('No history yet')}>
        <line
          x1="2"
          y1={height / 2}
          x2={width - 2}
          y2={height / 2}
          stroke="var(--surface-2)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 4"
        />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = values.length > 1 ? (width - 6) / (values.length - 1) : 0;
  const y = (v: number): number => height - 4 - ((v - min) / span) * (height - 8);
  const points = values.map((v, i) => `${3 + i * stepX},${y(v)}`).join(' ');
  const last = values[values.length - 1]!;
  const first = values[0]!;
  const stroke = last > first ? 'var(--ok)' : last < first ? 'var(--err)' : 'var(--text-3)';
  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label={label ?? tr('Trend from {v0} to {v1}', { v0: first, v1: last })}
    >
      {values.length === 1 ? (
        <circle cx={width / 2} cy={height / 2} r="3" fill={stroke} />
      ) : (
        <polyline
          points={points}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
