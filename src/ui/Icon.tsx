import { Sun } from '@phosphor-icons/react/Sun';
import { Path as PathIcon } from '@phosphor-icons/react/Path';
import { MusicNotes } from '@phosphor-icons/react/MusicNotes';
import { SlidersHorizontal } from '@phosphor-icons/react/SlidersHorizontal';
import { ChartBar } from '@phosphor-icons/react/ChartBar';
import { GearSix } from '@phosphor-icons/react/GearSix';
import { X } from '@phosphor-icons/react/X';
import { CaretLeft } from '@phosphor-icons/react/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { Check } from '@phosphor-icons/react/Check';
import { Fire } from '@phosphor-icons/react/Fire';
import { MapPin } from '@phosphor-icons/react/MapPin';
import { ArrowsClockwise } from '@phosphor-icons/react/ArrowsClockwise';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Shield } from '@phosphor-icons/react/Shield';
import { Moon } from '@phosphor-icons/react/Moon';
import { PianoKeys } from '@phosphor-icons/react/PianoKeys';
import { Lock } from '@phosphor-icons/react/Lock';
import { SealCheck } from '@phosphor-icons/react/SealCheck';
import { Circle } from '@phosphor-icons/react/Circle';
import { Play } from '@phosphor-icons/react/Play';
import { Stop } from '@phosphor-icons/react/Stop';
import { SpeakerHigh } from '@phosphor-icons/react/SpeakerHigh';
import type { ComponentType } from 'react';

/**
 * One icon family for the whole app (Phosphor), one weight, one size scale.
 * Nothing here draws SVG paths by hand: a missing glyph means importing
 * another Phosphor icon, never inventing one.
 */
const ICONS = {
  today: Sun,
  path: PathIcon,
  songs: MusicNotes,
  sandbox: SlidersHorizontal,
  progress: ChartBar,
  settings: GearSix,
  close: X,
  chevronLeft: CaretLeft,
  chevronRight: CaretRight,
  check: Check,
  streak: Fire,
  warmup: Fire,
  new: MapPin,
  review: ArrowsClockwise,
  create: Sparkle,
  freeze: Shield,
  rest: Moon,
  keys: PianoKeys,
  locked: Lock,
  badge: SealCheck,
  badgeEmpty: Circle,
  play: Play,
  stop: Stop,
  listen: SpeakerHigh,
} satisfies Record<string, ComponentType<IconGlyphProps>>;

interface IconGlyphProps {
  size?: number;
  weight?: 'regular' | 'fill';
  alt?: string;
  'aria-hidden'?: boolean;
}

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  size = 20,
  weight = 'regular',
  alt,
}: {
  name: IconName;
  size?: number;
  /** `fill` is the documented state variant: earned, done, currently active. */
  weight?: 'regular' | 'fill';
  /** Only when the icon is the whole message. Otherwise it stays decorative. */
  alt?: string;
}) {
  const Glyph = ICONS[name];
  return alt ? (
    <Glyph size={size} weight={weight} alt={alt} />
  ) : (
    <Glyph size={size} weight={weight} aria-hidden />
  );
}
