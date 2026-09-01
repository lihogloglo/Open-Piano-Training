import { memo, useMemo } from 'react';
import { layoutKeys, displayName, majorDegreeOf, WHITE_W, BLACK_H_RATIO, type KeyGeometry } from './utils';
import styles from './Keyboard.module.css';

export type KeyJudgment = 'perfect' | 'good' | 'ok' | 'wrong' | 'missed' | 'extra';
export type KeyTargetState = 'target' | 'hint';
export type KeyLabels = 'none' | 'names' | 'degrees' | 'fingers';

export interface KeyboardProps {
  /** [lo, hi] midi range; widened to white-key boundaries. Default C3–C6. */
  range?: [number, number];
  pressed: ReadonlySet<number>;
  targets?: ReadonlyMap<number, KeyTargetState>;
  judgments?: ReadonlyMap<number, KeyJudgment>;
  degreeTint?: { tonic: string; degrees?: readonly number[] } | null;
  labels?: KeyLabels;
  fingerMap?: ReadonlyMap<number, number>;
  ghost?: ReadonlySet<number>;
  onKeyDown?: (midi: number) => void;
  onKeyUp?: (midi: number) => void;
  height?: number;
}

const VIEW_H = 120;

const JUDGE_FILL: Record<KeyJudgment, string> = {
  perfect: 'var(--judge-perfect)',
  good: 'var(--judge-good)',
  ok: 'var(--judge-ok)',
  wrong: 'var(--judge-wrong)',
  missed: 'var(--judge-missed)',
  extra: 'var(--judge-wrong)',
};

interface KeyProps {
  geo: KeyGeometry;
  pressed: boolean;
  ghost: boolean;
  target: KeyTargetState | undefined;
  judgment: KeyJudgment | undefined;
  degree: number | null;
  label: string | null;
  onKeyDown: ((midi: number) => void) | undefined;
  onKeyUp: ((midi: number) => void) | undefined;
}

const Key = memo(function Key(p: KeyProps) {
  const { geo } = p;
  const h = geo.white ? VIEW_H : VIEW_H * BLACK_H_RATIO;
  const baseFill = geo.white ? 'var(--key-white)' : 'var(--key-black)';

  // Color precedence (05): judgment > active > target > degree tint > plain.
  let fill = baseFill;
  if (p.degree !== null) {
    fill = `color-mix(in srgb, var(--deg-${p.degree}) 35%, ${baseFill})`;
  }
  if (p.pressed || p.ghost) fill = 'var(--key-active)';
  if (p.judgment) fill = JUDGE_FILL[p.judgment];

  const showLabel = p.label !== null && geo.white;

  return (
    <g
      className={styles['key']}
      onPointerDown={(e) => {
        e.preventDefault();
        p.onKeyDown?.(geo.midi);
      }}
      onPointerUp={() => p.onKeyUp?.(geo.midi)}
      onPointerLeave={() => {
        if (p.pressed) p.onKeyUp?.(geo.midi);
      }}
    >
      <rect
        x={geo.x + 0.5}
        y={0}
        width={geo.width - 1}
        height={h}
        rx={geo.white ? 3 : 2.5}
        fill={fill}
        stroke={p.target ? 'var(--accent)' : 'var(--key-border)'}
        strokeWidth={p.target ? 2.5 : 1}
        opacity={p.ghost && !p.pressed ? 0.55 : 1}
        className={styles['keyRect']}
        transform={p.pressed ? 'translate(0 2)' : undefined}
      />
      {p.target === 'hint' && (
        <circle
          cx={geo.x + geo.width / 2}
          cy={h - 12}
          r={4}
          fill="var(--accent)"
          className={styles['hintDot']}
        />
      )}
      {showLabel && (
        <text x={geo.x + geo.width / 2} y={VIEW_H - 8} textAnchor="middle" className={styles['label']}>
          {p.label}
        </text>
      )}
    </g>
  );
});

export function Keyboard({
  range = [48, 84],
  pressed,
  targets,
  judgments,
  degreeTint = null,
  labels = 'none',
  fingerMap,
  ghost,
  onKeyDown,
  onKeyUp,
  height = 190,
}: KeyboardProps) {
  const layout = useMemo(() => layoutKeys(range[0], range[1]), [range]);

  const labelFor = (midi: number): string | null => {
    if (labels === 'names') return displayName(midi);
    if (labels === 'fingers') {
      const f = fingerMap?.get(midi);
      return f !== undefined ? String(f) : null;
    }
    if (labels === 'degrees' && degreeTint) {
      const d = majorDegreeOf(midi, degreeTint.tonic);
      return d !== null ? String(d) : null;
    }
    return null;
  };

  const degreeFor = (midi: number): number | null => {
    if (!degreeTint) return null;
    const d = majorDegreeOf(midi, degreeTint.tonic);
    if (d === null) return null;
    if (degreeTint.degrees && !degreeTint.degrees.includes(d)) return null;
    return d;
  };

  // Whites first so blacks render on top.
  const ordered = [...layout.keys].sort((a, b) => Number(b.white) - Number(a.white));

  return (
    <svg
      className={styles['keyboard']}
      viewBox={`0 0 ${layout.totalWidth} ${VIEW_H}`}
      preserveAspectRatio="none"
      style={{ height, width: '100%', display: 'block' }}
      role="img"
      aria-label={`Piano keyboard, ${displayName(layout.lo)} to ${displayName(layout.hi)}`}
    >
      {ordered.map((geo) => (
        <Key
          key={geo.midi}
          geo={geo}
          pressed={pressed.has(geo.midi)}
          ghost={ghost?.has(geo.midi) ?? false}
          target={targets?.get(geo.midi)}
          judgment={judgments?.get(geo.midi)}
          degree={degreeFor(geo.midi)}
          label={labelFor(geo.midi)}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
        />
      ))}
    </svg>
  );
}

export { WHITE_W };
