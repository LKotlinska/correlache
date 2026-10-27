import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkoutDto } from './create-workout.dto.js';

const valid = {
  title: 'Push day',
  startedAt: '2026-01-01T10:00:00.000Z',
  durationSeconds: 3600,
  exercises: [{ exerciseId: 1, sets: [{ weight: 50, reps: 8 }, { weight: null, reps: null }] }],
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
    expect(await errorsFor({ exercises: [{ exerciseId: 0, sets: [] }] })).toContain('exercises');
    expect(await errorsFor({ exercises: [{ exerciseId: 1, sets: [{ weight: -5, reps: 1 }] }] })).toContain('exercises');
    expect(await errorsFor({ exercises: [{ exerciseId: 1, sets: [{ weight: 5, reps: 1.5 }] }] })).toContain('exercises');
  });
});
