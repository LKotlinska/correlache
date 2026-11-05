import { readiness } from './readiness';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-05T12:00:00Z');
const entries = (count: number, daysAgo: number) =>
  Array.from({ length: count }, (_, i) => ({ startedAt: new Date(now - (daysAgo - i) * DAY_MS).toISOString() }));

describe('readiness', () => {
  it('is not ready with too few entries', () => {
    expect(readiness('headaches', entries(3, 30), [], now).ready).toBe(false);
  });

  it('is not ready when the history is too short', () => {
    expect(readiness('headaches', entries(6, 5), [], now).ready).toBe(false);
  });

  it('is ready with enough entries over enough weeks', () => {
    const r = readiness('headaches', entries(5, 15), [], now);
    expect(r.ready).toBe(true);
    expect(r.weeks).toBe(2);
  });

  it('ignores the other source for a single-source category', () => {
    expect(readiness('workouts', [], entries(5, 15), now).ready).toBe(true);
  });

  it('needs both sources for correlations', () => {
    expect(readiness('correlations', entries(10, 35), entries(9, 35), now).ready).toBe(false);
    expect(readiness('correlations', entries(10, 35), entries(10, 35), now).ready).toBe(true);
  });
});
