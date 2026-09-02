import { describe, expect, it } from 'vitest';
import { midiToName, nameToMidi, namePc, pcOf, midiToPcName } from './notes';
import { keySignature, keyUsesSharps, diatonicTriads, relativeKey, CIRCLE_OF_FIFTHS } from './keys';
import { degreeOf, degreeToMidi } from './degrees';
import {
  buildChord,
  chordPcs,
  chordSymbol,
  detectChord,
  matchesChordInversion,
  bassPcForInversion,
} from './chords';
import { scaleMidis, scaleFingering } from './scales';
import { parseRoman, progressionChords } from './progressions';

describe('notes', () => {
  it('maps names to midi', () => {
    expect(nameToMidi('C4')).toBe(60);
    expect(nameToMidi('A0')).toBe(21);
    expect(nameToMidi('C8')).toBe(108);
    expect(nameToMidi('F#3')).toBe(54);
    expect(nameToMidi('Bb2')).toBe(46);
    expect(nameToMidi('E♭4')).toBe(63);
    expect(nameToMidi('G♯2')).toBe(44);
    expect(nameToMidi('nonsense')).toBeNull();
  });

  it('spells midi in key context', () => {
    expect(midiToName(61, { tonic: 'Db', mode: 'major' })).toBe('D♭4');
    expect(midiToName(61, { tonic: 'A', mode: 'major' })).toBe('C♯4');
    expect(midiToName(61)).toBe('C♯4');
    expect(midiToPcName(63, { tonic: 'Eb', mode: 'major' })).toBe('E♭');
  });

  it('pitch classes', () => {
    expect(pcOf(60)).toBe(0);
    expect(pcOf(59)).toBe(11);
    expect(namePc('Eb')).toBe(3);
    expect(namePc('F#')).toBe(6);
  });
});

describe('keys', () => {
  it('key signatures', () => {
    expect(keySignature({ tonic: 'C', mode: 'major' })).toEqual({ alteration: 0, accidentals: [] });
    expect(keySignature({ tonic: 'D', mode: 'major' })).toEqual({
      alteration: 2,
      accidentals: ['F#', 'C#'],
    });
    expect(keySignature({ tonic: 'Eb', mode: 'major' })).toEqual({
      alteration: -3,
      accidentals: ['Bb', 'Eb', 'Ab'],
    });
    expect(keySignature({ tonic: 'A', mode: 'minor' }).alteration).toBe(0);
    expect(keySignature({ tonic: 'E', mode: 'minor' }).alteration).toBe(1);
  });

  it('sharp/flat spelling choice', () => {
    expect(keyUsesSharps({ tonic: 'G', mode: 'major' })).toBe(true);
    expect(keyUsesSharps({ tonic: 'F', mode: 'major' })).toBe(false);
  });

  it('diatonic triads of C major', () => {
    const triads = diatonicTriads({ tonic: 'C', mode: 'major' });
    expect(triads.map((t) => t.root)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(triads.map((t) => t.quality)).toEqual(['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']);
    expect(triads[4]?.roman).toBe('V');
    expect(triads[6]?.roman).toBe('vii°');
  });

  it('diatonic triads of E major spell sharps', () => {
    const triads = diatonicTriads({ tonic: 'E', mode: 'major' });
    expect(triads.map((t) => t.root)).toEqual(['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#']);
  });

  it('relative keys', () => {
    expect(relativeKey({ tonic: 'C', mode: 'major' })).toEqual({ tonic: 'A', mode: 'minor' });
    expect(relativeKey({ tonic: 'A', mode: 'minor' })).toEqual({ tonic: 'C', mode: 'major' });
    expect(relativeKey({ tonic: 'Eb', mode: 'major' })).toEqual({ tonic: 'C', mode: 'minor' });
  });

  it('circle of fifths shape', () => {
    expect(CIRCLE_OF_FIFTHS).toHaveLength(12);
    expect(CIRCLE_OF_FIFTHS[0]).toBe('C');
  });
});

describe('degrees', () => {
  it('degree of a note in a key', () => {
    const c = { tonic: 'C', mode: 'major' } as const;
    expect(degreeOf(60, c)).toBe(1);
    expect(degreeOf(67, c)).toBe(5);
    expect(degreeOf(61, c)).toBeNull();
    expect(degreeOf(63, { tonic: 'Eb', mode: 'major' })).toBe(1);
    expect(degreeOf(69, { tonic: 'A', mode: 'minor' })).toBe(1);
  });

  it('degree to midi', () => {
    const c = { tonic: 'C', mode: 'major' } as const;
    expect(degreeToMidi(1, c, 60)).toBe(60);
    expect(degreeToMidi(5, c, 60)).toBe(67);
    expect(degreeToMidi(7, { tonic: 'A', mode: 'minor' }, 57)).toBe(67); // G natural
  });
});

describe('chords', () => {
  it('builds root-position chords', () => {
    expect(buildChord({ root: 'C', quality: 'maj', inversion: 0 }, 60)).toEqual([60, 64, 67]);
    expect(buildChord({ root: 'A', quality: 'min', inversion: 0 }, 57)).toEqual([57, 60, 64]);
    expect(buildChord({ root: 'G', quality: '7', inversion: 0 }, 55)).toEqual([55, 59, 62, 65]);
  });

  it('builds inversions with the right bass', () => {
    const firstInv = buildChord({ root: 'C', quality: 'maj', inversion: 1 }, 60);
    expect(firstInv).toEqual([64, 67, 72]);
    const secondInv = buildChord({ root: 'C', quality: 'maj', inversion: 2 }, 60);
    expect(secondInv).toEqual([67, 72, 76]);
    expect(bassPcForInversion('C', 'maj', 1)).toBe(4);
    expect(bassPcForInversion('C', 'maj', 2)).toBe(7);
  });

  it('chord pcs and symbols', () => {
    expect(chordPcs('C', 'maj')).toEqual([0, 4, 7]);
    expect(chordPcs('F#', 'm7')).toEqual([1, 4, 6, 9]);
    expect(chordSymbol('Eb', 'm7')).toBe('E♭m7');
    expect(chordSymbol('C', 'maj')).toBe('C');
    expect(chordSymbol('F#', 'm7b5')).toBe('F♯m7♭5');
  });

  it('matches inversions octave-flexibly', () => {
    expect(matchesChordInversion([60, 64, 67], 'C', 'maj', 0)).toBe(true);
    expect(matchesChordInversion([48, 64, 79], 'C', 'maj', 0)).toBe(true); // spread voicing, C in bass
    expect(matchesChordInversion([64, 67, 72], 'C', 'maj', 1)).toBe(true);
    expect(matchesChordInversion([64, 67, 72], 'C', 'maj', 0)).toBe(false); // E in bass ≠ root pos
    expect(matchesChordInversion([60, 64, 68], 'C', 'maj', 0)).toBe(false); // wrong notes
    expect(matchesChordInversion([], 'C', 'maj', 0)).toBe(false);
  });

  it('detects chords with inversion, preferring root in bass', () => {
    expect(detectChord([60, 64, 67])).toMatchObject({ root: 'C', quality: 'maj', inversion: 0 });
    expect(detectChord([64, 67, 72])).toMatchObject({ root: 'C', quality: 'maj', inversion: 1 });
    expect(detectChord([57, 60, 64, 67])).toMatchObject({ root: 'A', quality: 'm7', inversion: 0 });
    expect(detectChord([55, 59, 62, 65])).toMatchObject({ root: 'G', quality: '7' });
    expect(detectChord([60, 64])).toBeNull();
    expect(detectChord([60, 61, 62])).toBeNull();
  });
});

describe('scales', () => {
  it('C major midis', () => {
    expect(scaleMidis('C', 'major', 1, 4)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });

  it('Eb major spelled correctly', () => {
    expect(scaleMidis('Eb', 'major', 1, 4)).toEqual([63, 65, 67, 68, 70, 72, 74, 75]);
  });

  it('A harmonic minor raises the 7th', () => {
    expect(scaleMidis('A', 'harmonic-minor', 1, 3)).toEqual([57, 59, 60, 62, 64, 65, 68, 69]);
  });

  it('two octaves', () => {
    const two = scaleMidis('C', 'major', 2, 4);
    expect(two).toHaveLength(15);
    expect(two[14]).toBe(84);
  });

  it('C blues scale', () => {
    expect(scaleMidis('C', 'blues', 1, 4)).toEqual([60, 63, 65, 66, 67, 70, 72]);
  });

  it('fingerings', () => {
    expect(scaleFingering('C', 'major', 'rh')).toEqual([1, 2, 3, 1, 2, 3, 4, 5]);
    expect(scaleFingering('F', 'major', 'rh')).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    expect(scaleFingering('C', 'major', 'lh')).toEqual([5, 4, 3, 2, 1, 3, 2, 1]);
    expect(scaleFingering('Bb', 'major', 'rh')).toEqual([4, 1, 2, 3, 1, 2, 3, 4]);
    expect(scaleFingering('C', 'blues', 'rh')).toBeNull();
    const two = scaleFingering('C', 'major', 'rh', 2);
    expect(two).toHaveLength(15);
    expect(two?.[7]).toBe(1); // second-octave restart
    expect(two?.[14]).toBe(5);
  });
});

describe('progressions', () => {
  const c = { tonic: 'C', mode: 'major' } as const;

  it('parses triad romans', () => {
    expect(parseRoman('I', c)).toMatchObject({ degree: 1, root: 'C', quality: 'maj' });
    expect(parseRoman('vi', c)).toMatchObject({ degree: 6, root: 'A', quality: 'min' });
    expect(parseRoman('vii°', c)).toMatchObject({ degree: 7, root: 'B', quality: 'dim' });
  });

  it('parses seventh romans', () => {
    expect(parseRoman('V7', c)).toMatchObject({ root: 'G', quality: '7' });
    expect(parseRoman('ii7', c)).toMatchObject({ root: 'D', quality: 'm7' });
    expect(parseRoman('Imaj7', c)).toMatchObject({ root: 'C', quality: 'maj7' });
    expect(parseRoman('viiø7', c)).toMatchObject({ root: 'B', quality: 'm7b5' });
  });

  it('minor key romans', () => {
    const am = { tonic: 'A', mode: 'minor' } as const;
    expect(parseRoman('i', am)).toMatchObject({ root: 'A', quality: 'min' });
    expect(parseRoman('VI', am)).toMatchObject({ root: 'F', quality: 'maj' });
    expect(parseRoman('VII', am)).toMatchObject({ root: 'G', quality: 'maj' });
  });

  it('progressions in other keys', () => {
    const g = { tonic: 'G', mode: 'major' } as const;
    const chords = progressionChords(['I', 'V', 'vi', 'IV'], g);
    expect(chords.map((ch) => ch.root)).toEqual(['G', 'D', 'E', 'C']);
    expect(chords.map((ch) => ch.quality)).toEqual(['maj', 'maj', 'min', 'maj']);
  });

  it('rejects garbage', () => {
    expect(() => parseRoman('XI', c)).toThrow();
    expect(() => parseRoman('', c)).toThrow();
  });
});
