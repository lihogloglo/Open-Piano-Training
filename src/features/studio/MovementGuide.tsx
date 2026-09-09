import { tr } from '@/i18n';
/** A schematic observation aid, not a prescribed body shape or a motion score. */
export function MovementGuide() {
  return (
    <details>
      <summary>{tr('See the movement guide')}</summary>
      <svg
        viewBox="0 0 640 210"
        role="img"
        aria-label={tr(
          'Side view: feet supported, forearm near key height, and wrist following the hand sideways',
        )}
        style={{ maxWidth: 640, width: '100%', color: 'var(--text)' }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="32" r="16" />
          <path d="M90 52 L92 110 L137 110 L147 176 L175 176 M93 67 L112 100 L165 100 L181 106 M65 119 H112 M72 119 V181 M106 119 V181 M163 112 H273 V125 H163 M244 125 V183 M55 186 H280" />
          <path d="M355 129 H586 M355 144 H586 M360 129 V144 M385 129 V144 M410 129 V144 M435 129 V144 M460 129 V144 M485 129 V144 M510 129 V144 M535 129 V144 M560 129 V144 M585 129 V144" />
          <path d="M352 98 Q391 93 429 101 Q447 105 459 123 M433 102 Q448 98 467 119 M438 99 Q458 92 477 117 M442 94 Q462 85 486 117" />
          <path d="M420 60 H505 M420 60 L430 53 M420 60 L430 67 M505 60 L495 53 M505 60 L495 67" />
        </g>
        <g fill="currentColor" fontSize="15" fontFamily="sans-serif">
          <text x="55" y="207">
            {tr('Feet supported; shoulders easy')}
          </text>
          <text x="352" y="179">
            {tr('Move the arm with the hand')}
          </text>
          <text x="352" y="201">
            {tr('Keep the wrist flexible')}
          </text>
        </g>
      </svg>
      <p>
        {tr(
          'Adjust the seat so your forearm is close to key height. Let curved fingers rest on the keys without squeezing. Move slowly across five keys and let the arm follow. Body proportions differ: seek an easy movement, not an exact angle. Stop if movement hurts.',
        )}
      </p>
    </details>
  );
}
