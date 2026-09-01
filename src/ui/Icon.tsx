const PATHS = {
  today:
    'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  path: 'M6 3v6a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v6M6 3a2 2 0 1 0 0 .01M18 21a2 2 0 1 0 0-.01',
  songs: 'M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  sandbox: 'M4 6h16M4 12h16M4 18h16M8 4v4M14 10v4M10 16v4',
  progress: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm8 3a8 8 0 0 0-.1-1.3l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.2-1.3L15 3h-4l-.4 2.5a8 8 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.4-1c.7.5 1.4 1 2.2 1.3L9 21h4l.4-2.5a8 8 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z',
  close: 'M6 6l12 12M18 6L6 18',
  chevronLeft: 'M14 6l-6 6 6 6',
  chevronRight: 'M10 6l6 6-6 6',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
