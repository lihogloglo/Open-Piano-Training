# 07 — Progress, Scheduling & Motivation

Pure logic in `src/progress/`; persisted per 02 §Database.

## Skill atoms

`progress/atoms.ts` builds the full registry at boot from curriculum content (every id in any unit's `concepts` must resolve). Each entry also carries the drill exercise the review loop runs for it, or `null` when the atom is tracked but not directly drillable. Difficulty (1–100) is assigned by rule, not by hand:

```
base by kind: note-find 5 · fivefinger 8 · flashcard/keysig 10 · scale 20 · chord grip 15
            · prog 30 · ear 25 · voicing 40 · comp 45 · sightcomp/transcribe 70
modifiers: +2 per accidental in key/root · +5 per inversion level · +8 harmonic-minor/blues
         · +5 hand 'both' · +10 strict tier material · clamp 1..100
```

An atom becomes **tracked** (gets an FSRS card) when its introducing unit is passed.

## FSRS integration (`progress/fsrs.ts`)

- One ts-fsrs `Card` per tracked atom, default FSRS parameters, `requestRetention: 0.9`.
- Grade mapping from a take's score for that atom:
  `score < 0.80 → Again · 0.80–0.85 → Hard · 0.85–0.95 → Good · > 0.95 → Easy`
  For multi-atom takes (interleave drills), compute per-atom sub-scores from the judgments belonging to that atom's targets.
- Wait-mode/guided attempts never grade cards (only tempo-mode graded/drill items do).
- Review of a due atom happens through the real playing drill on its registry entry (`atom.drill`).

**Fluency** (drives the heatmap + "fluent" chip): `fsrs.stability ≥ 30 days AND bestScore ≥ 0.9 at standard tier or stricter`.

## Session builder (`progress/sessionBuilder.ts`)

Input: date, settings.dailyMinutes, path state, due atoms. Output: `SessionPlan`.

```
budget = dailyMinutes (default 20)
blocks:
 1. warmup (2 min): 2 easy exercises from fluent atoms in the CURRENT stage's keys
    (scale-run at 90% tempo + grip-interleave count 8). Skip if day's first unit is s0-s1.
 2. new (unit.minutes): the next available unit (path.ts). Omit if learner is mid-nothing
    (all caught up) — replaced by a rating challenge suggestion.
 3. review (min(6, budget-used)): due atoms by (overdue-ness × difficulty) desc, cap 10,
    interleaved into at most 3 drill groups by generator kind. If >20 due, flag catchUp=true
    (Today shows the catch-up banner; workout mode = review-only session).
 4. create (2 min): prompt cycles a curated list matched to the learner's stage
    (e.g. S3+: "loop vi–IV–I–V in G and make the RH sing").
Constraint: blocks 1+3+4 alone must fit in 10 min for the 10-minute setting (drop warmup first, then create).
```

Session state persists same-day (resume mid-block); a new day builds a fresh plan.

## Mastery gates (`curriculum/path.ts` + `progress/service.ts`)

Unlock state is computed by `nodeStatuses()` in `path.ts`; passes and checkpoint
fan-out are written by `completeUnit()` in `service.ts`. There is no `gates.ts`.

- Unit `available` when all prerequisites passed; `passed` when its graded step(s) pass.
- Checkpoint pass ⇒ marks all its stage's units passed (placement path) and unlocks next stage.
- "Mark for extra review and move on" (3 fails): unit becomes `passed*` (asterisk state, shown amber) — atoms scheduled Again; a passed* unit re-tests its graded step inside the next review node; clearing it converts to a normal pass. Not available on checkpoints.

## Ratings (`progress/ratings.ts`) — the SASR-style ladder

Per strand: `keys`, `theory`, `ear` (v1); `read`, `create` reserved (create is never numerically rated — it gets badges only; read arrives Phase 8).

- Level 1–99. Display number = `level × 10` (so "level 340" reads like an ELO).
- A challenge = 10 items generated fresh at the level's difficulty band: target atom difficulty `d ∈ [level−5, level+5]` mapped through the atom registry, drawn ONLY from tracked atoms (rating can't exceed what the path has taught — the path unlocks material, the rating proves it).
- Item pass = score ≥ 0.8 (each item is one short generated exercise, seedPolicy random).
- Outcome: `≥8/10 → level+2` · `6–7 → +1` · `4–5 → hold` · `≤3 → −1` (floor: highest level band with ≥2 tracked atoms).
- Challenges are always available, never required; the Today screen suggests one per strand per week.
- History appended per challenge (sparkline data).

## Streaks, badges, recap (`progress/stats.ts`)

- **Streak**: a day counts with ≥5 minutes of completed blocks. 1 freeze earned per 7-day streak (max 2 banked, auto-spent). UI shows freeze as a shield on the flame. No loss messaging beyond neutral "streak reset".
- **Badges** (toast + wall; id, title, criterion — all computed from Dexie, no new state):
  `first-note` (setup complete) · `first-song` (any chart-play pass) · `spelling-bee` (20 grips <3s) · `circle-complete` (all 12 keysig atoms tracked) · `smooth-operator` (first vl-scored ★★★) · `all-twelve` (ii-V-I all keys pass) · `chart-slayer` (unseen chart first-try pass) · `bluesman` (s7.u4 pass) · `by-ear` (transcription pass) · `deep-groove` (any comp atom fluent) · `centurion` (100 sessions) · `then-vs-now` (view a 4-week replay pair).
- **Weekly recap** (computed Sunday, shown as a Today card until dismissed): minutes, sessions, new atoms, atoms gone fluent, rating deltas, one highlighted replay pair. Store the computed recap in `meta`.

## Honest-progress invariants (do not violate in any future change)

1. Ratings only ever move from fresh generated items — never from replayed known content.
2. FSRS scheduling is never overridden by streak/gamification logic.
3. Nothing in the app punishes a wrong note beyond information (no lives, no lockouts, retries always free).
4. Every number shown to the learner (score, rating, fluency) must be explainable by tapping it (an info popover states the formula in one sentence).

## Review changes (2026-09-06)

These rules replace the original whole-lesson budget and automatic minute credit.

- Daily new-work blocks store an exclusive `endStep`. A long lesson stops at that saved boundary and continues in a later session.
- Review blocks include up to two exact graded retests. Successful retests clear their queue entries and eventually the unit flag.
- Creative tasks rotate among completed lessons. The preference selects melody, rhythm, or harmony where suitable tasks exist.
- Recent drill scores identify current difficulties. Best scores remain separate historical records.
- Practice time counts focused, visible practice screens after input. Activity expires after 60 seconds. Hidden and unfocused time does not count.
- `lessonResume:*` metadata stores the current step, scores, ladder successes, and assessment outcomes.
- Reading-strand history remains stored when disabled. New scheduling and saved drill blocks exclude its tasks.
- Completed lessons and self-checks do not imply independent performance. Independent takes pass without automatic hints.
- Retained performances require matching conditions on separate local calendar dates. The recall map still describes scheduled review memory.
- Export includes local preferences. Import validates rows, exercise definitions, and lesson references before a database transaction replaces content.
