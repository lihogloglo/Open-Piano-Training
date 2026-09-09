import { tr } from '@/i18n';
export function ScoreDial({ score, size = 110 }: { score: number; size?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const pct = Math.round(score * 100);
  const color =
    score >= 0.8 ? 'var(--judge-perfect)' : score >= 0.6 ? 'var(--judge-ok)' : 'var(--judge-wrong)';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={tr('Score {v0} percent', { v0: pct })}
    >
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${c * score} ${c}`}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 600ms var(--ease)' }}
      />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        style={{ fontSize: 22, fontWeight: 600, fill: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}
      >
        {pct}%
      </text>
    </svg>
  );
}
