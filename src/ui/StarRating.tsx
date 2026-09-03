import { Star } from '@phosphor-icons/react/Star';

export function StarRating({ stars, size = 22 }: { stars: 0 | 1 | 2 | 3; size?: number }) {
  return (
    <span aria-label={`${stars} of 3 stars`} style={{ display: 'inline-flex', gap: 3 }}>
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={size}
          weight={i <= stars ? 'fill' : 'regular'}
          color={i <= stars ? 'var(--judge-ok)' : 'var(--border-strong)'}
          aria-hidden
        />
      ))}
    </span>
  );
}
