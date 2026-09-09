import { tr } from '@/i18n';
export function ProgressRing({ fraction, size = 44 }: { fraction: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role="img"
      aria-label={tr('{v0}% complete', { v0: Math.round(fraction * 100) })}
    >
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
      {/* A round cap on a zero-length arc draws a dot, which reads as 1%. */}
      {fraction > 0 && (
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${c * fraction} ${c}`}
          transform="rotate(-90 22 22)"
        />
      )}
      <text
        x="22"
        y="26"
        textAnchor="middle"
        style={{ fontSize: 11, fill: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}
      >
        {Math.round(fraction * 100)}
      </text>
    </svg>
  );
}
