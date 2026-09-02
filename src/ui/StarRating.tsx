export function StarRating({ stars, size = 22 }: { stars: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <span aria-label={`${stars} of 3 stars`} style={{ display: 'inline-flex', gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z"
            fill={i <= stars ? 'var(--judge-ok)' : 'var(--surface-2)'}
            stroke={i <= stars ? 'var(--judge-ok)' : 'var(--border)'}
            strokeWidth="1"
          />
        </svg>
      ))}
    </span>
  );
}
