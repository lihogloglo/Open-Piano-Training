import { levelDisplay, MAX_LEVEL } from '@/progress/ratings';

/**
 * The strand rating as a dial: the big number is `level × 10` so it reads like
 * an ELO, and the arc shows how far up the ladder that is.
 */
export function RatingDial({
  level,
  label,
  size = 116,
  pending = false,
}: {
  level: number;
  label: string;
  size?: number;
  pending?: boolean;
}) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, level / MAX_LEVEL));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={pending ? `${label}: not rated yet` : `${label} rating ${levelDisplay(level)}`}
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
      {!pending && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${c * frac} ${c}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 600ms var(--ease)' }}
        />
      )}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        style={{
          fontSize: pending ? 12 : 24,
          fontWeight: 600,
          fill: pending ? 'var(--text-3)' : 'var(--text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pending ? 'unrated' : levelDisplay(level)}
      </text>
      <text x="50" y="70" textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-2)' }}>
        {label}
      </text>
    </svg>
  );
}
