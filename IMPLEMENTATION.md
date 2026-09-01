# Implementation Plan — Entry Point

This is the build specification for the product described in [PLAN.md](PLAN.md). It describes the **finished state** — UI, UX, architecture, data, algorithms, content — precisely enough that an implementing agent can build it without inventing design decisions.

## How to use these docs (instructions to the implementing agent)

1. **Read [docs/implementation/00-overview.md](docs/implementation/00-overview.md) first**, then skim every other doc once before writing code.
2. **Build in the order given by [08-build-order.md](docs/implementation/08-build-order.md).** Do not reorder phases. Each phase has acceptance criteria; do not start a phase until the previous phase's criteria pass.
3. **Where these docs specify a value (a color, a millisecond window, a formula, a type), use that value.** Do not substitute your own judgment for specified decisions. If a situation is genuinely unspecified, follow the doc's stated design principles, choose the smallest consistent option, and record the decision in `docs/decisions.md`.
4. **The engine is pure and tested.** Everything under `src/engine/`, `src/theory/`, and `src/progress/` must be pure TypeScript (no React, no DOM, no I/O) with Vitest coverage as specified.
5. **Curriculum is data.** Never special-case a unit in engine or UI code. If a unit needs something the schema can't express, extend the schema (and its validator) first.

## Document map

| Doc | Contents |
|---|---|
| [00-overview.md](docs/implementation/00-overview.md) | Product one-pager, quality bar, glossary, decisions log rules |
| [01-architecture.md](docs/implementation/01-architecture.md) | Stack, folder structure, module boundaries, state rules, conventions, testing strategy |
| [02-data-model.md](docs/implementation/02-data-model.md) | All TypeScript types: curriculum schema, exercises, attempts, progress; Dexie schema; ID conventions |
| [03-midi-audio.md](docs/implementation/03-midi-audio.md) | MIDI adapter interface + implementations, clocks, sampler, metronome, latency handling |
| [04-exercise-engine.md](docs/implementation/04-exercise-engine.md) | Generators, matcher state machines, timing windows, scoring formulas, replay format |
| [05-ui-ux.md](docs/implementation/05-ui-ux.md) | Design tokens, theming, component inventory, every screen's layout and behavior, a11y, copy tone |
| [06-curriculum-content.md](docs/implementation/06-curriculum-content.md) | Authoring guide + the complete unit-by-unit content plan for Stages 0–7 |
| [07-progress-scheduling.md](docs/implementation/07-progress-scheduling.md) | Skill atoms, FSRS integration, session builder, mastery gates, skill ratings, streaks/badges |
| [08-build-order.md](docs/implementation/08-build-order.md) | Phased task breakdown with acceptance criteria and test checklists |
