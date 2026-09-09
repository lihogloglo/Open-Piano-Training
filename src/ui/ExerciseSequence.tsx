import { tr } from '@/i18n';
import { useEffect, useRef } from 'react';
import type { ExerciseInstance } from '@/engine/types';
import { targetMidis } from '@/engine/matcher/setMatch';
import { midiToPcName } from '@/theory/notes';
import { useRunStore } from '@/store/runStore';
import styles from './ExerciseSequence.module.css';

export function ExerciseSequence({
  instance,
  activeIndex,
}: {
  instance: ExerciseInstance;
  activeIndex?: number | undefined;
}) {
  const phase = useRunStore((s) => s.phase);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    list.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeIndex]);
  if (instance.perTargetPreview || instance.audioPreview)
    return (
      <p>
        {tr(
          'Listen to each example, then play your answer. Any permitted octave is shown in the instructions.',
        )}
      </p>
    );
  if (instance.def.assessment && (phase === 'running' || phase === 'count-in'))
    return <p>{tr('Play the sequence you just heard. Restart to hear it again.')}</p>;
  const exact = instance.targets.some((t) => (t.kind === 'note' || t.kind === 'set') && !t.octaveFlexible);
  const interval = instance.targets.some((t) => t.kind === 'set' && t.transposeOnly);
  const splitHands = instance.targets.some((t) => t.kind === 'set' && t.midiRange);
  const chords = instance.targets.some((t) => t.kind === 'set' && t.midis.length > 1);
  const showOctaves = exact || splitHands || interval;
  const inversions = instance.targets.some((t) => t.kind === 'set' && t.inversionOf);
  return (
    <section className={styles['sequence']} aria-label={tr('Sequence to play')}>
      <p>
        <strong>{tr('Sequence to play')}</strong>
        {tr(' — read from left to right.')}
        {chords && tr(' Notes joined by + play together.')}
      </p>
      <p>
        {interval
          ? tr('Any octave works. Keep the interval spacing and play the named note lowest.')
          : splitHands
            ? tr(
                'Play the shown bass part. Keep right-hand chord notes at or above C4 (middle C); any inversion works.',
              )
            : exact
              ? tr('Use the shown octaves. C4 is middle C.')
              : inversions
                ? tr('Any octave works. Keep the requested chord note lowest.')
                : chords
                  ? tr('Any octave works. Play all the chord notes together, in any order from low to high.')
                  : tr('Any octave works. Play one note at a time.')}
      </p>
      <ol ref={list} className={styles['notes']}>
        {instance.targets.map((target, i) => {
          const at = target.atBeat ?? i * (instance.beatsPerTarget ?? 1);
          const beats = instance.beatsPerBar ?? 4;
          const label =
            target.kind === 'set'
              ? target.label
              : target.kind === 'note'
                ? midiToPcName(target.midi, instance.prompt.key)
                : (instance.prompt.perTarget?.[i]?.label ?? 'Play');
          return (
            <li key={i} data-active={activeIndex === i} aria-current={activeIndex === i ? 'step' : undefined}>
              <strong>{label}</strong>
              {(target.kind !== 'note' || showOctaves) && (
                <span>
                  {targetMidis(target)
                    .map(
                      (m) =>
                        midiToPcName(m, instance.prompt.key) + (showOctaves ? Math.floor(m / 12) - 1 : ''),
                    )
                    .join(' + ')}
                </span>
              )}
              {instance.def.mode === 'tempo' && (
                <small>
                  {tr('Bar {bar}, beat {beat}', {
                    bar: Math.floor(at / beats) + 1,
                    beat: Number(((at % beats) + 1).toFixed(2)),
                  })}
                </small>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
