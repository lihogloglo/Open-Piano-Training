# Working notes for agents

## How to write to the user

The user finds normal Claude prose hard to read. Write in plain English instead. Use the
`asd-ste100` skill in `.claude/skills/asd-ste100/`, in its **STE-flavored** mode, for everything
you say to the user: chat replies, commit messages, PR text, and documents you produce.

The rules that matter most here:

- One idea per sentence. Keep sentences under 25 words.
- Active voice. Name who does the thing.
- No semicolons. Split the sentence instead.
- No phrasal verbs. Write "start", not "spin up". Write "read", not "dive into".
- No nominalised verbs. Write "we analysed the log", not "we performed an analysis of the log".
- No marketing adjectives: seamless, robust, powerful, blazing-fast.
- No hedge stacks. State the claim, or delete it. Keep a real hedge ("may have failed") as it is.
- One name per thing. Do not call the same thing a "unit", an "item" and a "node" in one reply.
- Three or more steps go in a numbered list, not inside one sentence.
- Explain a technical word the first time you use it, or use a plainer word.

**Do not rewrite the lesson prose in `src/curriculum/content/` to these rules.** That copy teaches,
and its metaphors do real work. Only one rule carries over there: **never use a music term before
the lesson explains it.** If a unit needs a new term, give it one plain sentence at first use.

## Tests: what to run, and when

- `npm test` (vitest) and `npm run lint` / `npm run typecheck` — run these freely, they take seconds.
- **Targeted Playwright specs** (`npx playwright test e2e/<file>.spec.ts -g "<name>"`) — fine when you
  changed the thing they cover. One lesson-driving test is 1–3 minutes.
- **`e2e/marathon.spec.ts` is not a routine check.** It walks the entire path, s0.u1 → s7.cp, and takes
  the better part of an hour of machine time. **Do not run it as part of ordinary content or code
  work, and do not kick it off in the background "just to be safe".** It gets its own deliberate
  pass, run when the user asks for one. The same goes for running the whole `e2e/` directory at once.

If you believe a change needs marathon-level coverage, say so and let the user decide.

## Curriculum content

- Curriculum is data under `src/curriculum/content/stageN.ts`. Never special-case a unit in engine or
  UI code — extend the schema first (see `IMPLEMENTATION.md` §How to use these docs).
- `src/curriculum/curriculum.test.ts` carries a **curriculum lint** that enforces the minimum teaching
  grammar for every stage listed in its `REBUILT` array: each lesson unit needs ≥1 `guided`, ≥1
  `ladder`, ≥1 `graded`, a `create` step with a real exercise, and no `explain` step without a block
  the learner has to play (`playCheck` or `earCheck`). Units with no motor pattern to ramp are exempt
  from the ladder rule by id in `NO_MOTOR_PATTERN`, with a reason.
- The same file carries a second lint, **"graded takes only score rehearsed material"**. A graded take
  may change the key, the tempo and the length of what the unit rehearsed. It may not add a motor
  pattern the learner has never made: a new scale fingering, a new comp pattern, a new voicing, a new
  song, or a chord the path never taught. A take at tempo also needs a ladder at the same signature
  that reaches its BPM. If you add a graded step, add the rep that earns it.
- Record every deviation or extension in `docs/decisions.md`, and keep
  `docs/implementation/06-curriculum-content.md` in step with what was actually built.
- `docs/content-audit.md` is the measurement that started the content rebuild. It is kept as written;
  its status header says what has since been done and what is still open.
