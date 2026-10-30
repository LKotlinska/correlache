import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkoutDto } from './create-workout.dto.js';

const valid = {
  title: 'Push day',
  startedAt: '2026-01-01T10:00:00.000Z',
  durationSeconds: 3600,
  exercises: [{ exerciseId: 1, trackingMode: 'weight_reps', sets: [{ weight: 50, reps: 8 }, { weight: null, reps: null }] }],
};

async function errorsFor(overrides: Record<string, unknown>) {
  const errors = await validate(plainToInstance(CreateWorkoutDto, { ...valid, ...overrides }));
  return errors.map((e) => e.property);
}

describe('CreateWorkoutDto', () => {
  it('accepts a valid payload (including empty set fields)', async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it.each([
    ['a blank title', { title: '   ' }, 'title'],
    ['a start time without timezone', { startedAt: '2026-01-01T10:00:00' }, 'startedAt'],
    ['a start time in the future', { startedAt: '2999-01-01T10:00:00.000Z' }, 'startedAt'],
    ['a negative duration', { durationSeconds: -1 }, 'durationSeconds'],
    ['a duration of a day or more', { durationSeconds: 86400 }, 'durationSeconds'],
    ['no exercises', { exercises: [] }, 'exercises'],
  ])('rejects %s', async (_label, overrides, property) => {
    expect(await errorsFor(overrides)).toContain(property);
  });

  it('validates nested exercises and sets', async () => {
    expect(await errorsFor({ exercises: [{ exerciseId: 0, trackingMode: 'weight_reps', sets: [] }] })).toContain('exercises');
    expect(await errorsFor({ exercises: [{ exerciseId: 1, trackingMode: 'weight_reps', sets: [{ weight: -5, reps: 1 }] }] })).toContain('exercises');
    expect(await errorsFor({ exercises: [{ exerciseId: 1, trackingMode: 'weight_reps', sets: [{ weight: 5, reps: 1.5 }] }] })).toContain('exercises');
  });

  it('accepts time and distance sets in a time mode', async () => {
    const exercises = [{ exerciseId: 1, trackingMode: 'duration_distance', sets: [{ distance: 2.5, durationSeconds: 1800 }] }];
    expect(await errorsFor({ exercises })).toEqual([]);
  });

  it.each([
    ['an unknown tracking mode', { trackingMode: 'stretch', sets: [] }],
    ['a missing tracking mode', { trackingMode: undefined, sets: [] }],
    ['a negative distance', { trackingMode: 'duration_distance', sets: [{ distance: -1 }] }],
    ['a fractional duration', { trackingMode: 'duration', sets: [{ durationSeconds: 1.5 }] }],
    ['a set duration of a day or more', { trackingMode: 'duration', sets: [{ durationSeconds: 86400 }] }],
  ])('rejects %s', async (_label, exercise) => {
    expect(await errorsFor({ exercises: [{ exerciseId: 1, ...exercise }] })).toContain('exercises');
  });
});
