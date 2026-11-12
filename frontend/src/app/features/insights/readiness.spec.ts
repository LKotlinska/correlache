import { readiness } from './readiness';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-05T12:00:00Z');
/** `count` entries, the earliest `daysAgo` days ago. */
const entries = (count: number, daysAgo: number) => ({
  count,
  firstStartedAt: count ? new Date(now - daysAgo * DAY_MS).toISOString() : null,
});
const none = entries(0, 0);

describe('readiness', () => {
  it('is not ready with too few entries', () => {
    expect(readiness('headaches', { headaches: entries(3, 30), workouts: none }, now).ready).toBe(false);
  });

  it('is not ready when the history is too short', () => {
    expect(readiness('headaches', { headaches: entries(6, 5), workouts: none }, now).ready).toBe(false);
  });

  it('is ready with enough entries over enough weeks', () => {
    const r = readiness('headaches', { headaches: entries(5, 15), workouts: none }, now);
    expect(r.ready).toBe(true);
    expect(r.weeks).toBe(2);
  });

  it('ignores the other source for a single-source category', () => {
    expect(readiness('workouts', { headaches: none, workouts: entries(5, 15) }, now).ready).toBe(true);
  });

  it('needs both sources for correlations', () => {
    expect(readiness('correlations', { headaches: entries(10, 35), workouts: entries(9, 35) }, now).ready).toBe(false);
    expect(readiness('correlations', { headaches: entries(10, 35), workouts: entries(10, 35) }, now).ready).toBe(true);
  });
});
