/**
 * Tourist mode: the learner walks the path as a visitor.
 *
 * Two things change while it is on. The Path opens every locked unit, and the
 * lesson player lets the learner skip a step or jump to any step. In exchange,
 * nothing is recorded: no unit status, no takes, no review cards, no practice
 * minutes, no rating. A visit leaves the real progress exactly as it was.
 *
 * The flag lives here as one module-level boolean, not in the settings store,
 * for two reasons. `src/progress/` must stay pure TypeScript with no store
 * import (01 §Module boundaries), and a progress write is not a React render,
 * so it needs a value it can read at call time. `initTouristMode()` in the
 * settings store keeps this boolean in step with the stored preference.
 */

let tourist = false;

/** Turn tourist mode on or off. Called by the settings store, and by tests. */
export function setTouristMode(on: boolean): void {
  tourist = on;
}

/** True while the visit must not be recorded. */
export function isTourist(): boolean {
  return tourist;
}
