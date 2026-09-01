# Decisions log

Deviations/extensions beyond docs/implementation, per 00-overview §Decisions log.

- **2026-09-01** — Settings (theme, device id, volumes, sidebar) persist in `localStorage` (`ks.settings.v1`), not the Dexie `settings` table. Alternatives: Dexie as 02 lists. Reason: synchronous boot (no theme flash) and 02 itself allows localStorage for tiny prefs; Dexie remains the store for progress data. Extends 02 §Settings.
- **2026-09-01** — Playwright uses the sandbox's pinned Chromium via `launchOptions.executablePath` when `/opt/pw-browsers/chromium` exists and not in CI. Extends 01 §Testing.
