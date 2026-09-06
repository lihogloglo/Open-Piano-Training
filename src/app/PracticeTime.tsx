import { useEffect } from 'react';
import { subscribeMidiEvents, releaseAllInput } from '@/store/midiStore';
import { addPracticeMinutes } from '@/progress/service';
import { localDateString } from '@/progress/sessionBuilder';
import { useRunStore } from '@/store/runStore';

/** Count engaged time in practice screens. Never substitute the authored lesson estimate. */
export function PracticeTime() {
  useEffect(() => {
    let lastActivity = Number.NEGATIVE_INFINITY;
    let previous = performance.now();
    let pending = 0;
    let day = localDateString(new Date());
    const active = () => {
      lastActivity = performance.now();
    };
    const flush = () => {
      const minutes = pending / 60_000;
      pending = 0;
      if (minutes > 0) void addPracticeMinutes(day, minutes);
    };
    const tick = () => {
      const now = performance.now();
      const nextDay = localDateString(new Date());
      if (day !== nextDay) {
        flush();
        day = nextDay;
      }
      if (
        !document.hidden &&
        document.hasFocus() &&
        now - lastActivity < 60_000 &&
        /^\/(?:lesson\/|drill\/|rating\/|sandbox(?:\/|$)|studio\/|songs\/)/.test(location.pathname)
      ) {
        pending += Math.min(1100, now - previous);
      }
      previous = now;
      if (pending >= 5000) flush();
    };
    const hide = () => {
      if (document.hidden) {
        tick();
        flush();
        releaseAllInput();
        useRunStore.getState().abortRun();
      }
    };
    const blur = () => {
      tick();
      flush();
      releaseAllInput();
      lastActivity = Number.NEGATIVE_INFINITY;
    };
    const off = subscribeMidiEvents(active);
    window.addEventListener('pointerdown', active);
    window.addEventListener('keydown', active);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hide);
    const timer = setInterval(tick, 1000);
    return () => {
      clearInterval(timer);
      flush();
      off();
      window.removeEventListener('pointerdown', active);
      window.removeEventListener('keydown', active);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);
  return null;
}
