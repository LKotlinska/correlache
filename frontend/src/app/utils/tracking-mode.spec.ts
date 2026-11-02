import { columnCount, defaultTrackingModeFor, TRACKED_FIELDS } from './tracking-mode';

describe('tracking mode', () => {
  it.each([
    ['Rope', 'reps'],
    ['Assisted', 'reps'],
    ['Body weight', 'reps'],
    ['Stationary bike', 'duration_distance'],
    ['SkiErg machine', 'duration_distance'],
    ['Barbell', 'weight_reps'],
    ['', 'weight_reps'],
  ])('defaults %s to %s', (equipment, mode) => {
    expect(defaultTrackingModeFor(equipment)).toBe(mode);
  });

  it('counts one grid column per input, two for hours and minutes', () => {
    expect(columnCount(TRACKED_FIELDS.weight_reps)).toBe(2);
    expect(columnCount(TRACKED_FIELDS.reps)).toBe(1);
    expect(columnCount(TRACKED_FIELDS.duration)).toBe(2);
    expect(columnCount(TRACKED_FIELDS.duration_distance)).toBe(3);
  });
});
