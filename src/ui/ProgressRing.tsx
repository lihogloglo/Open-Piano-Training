export function ProgressRing({ fraction, size = 44 }: { fraction: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      role="img"
      aria-label={`${Math.round(fraction * 100)}% complete`}
    >
      <circle cx="22" cy="22" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="4" />
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
