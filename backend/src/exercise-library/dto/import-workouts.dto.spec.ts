import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImportWorkoutsDto, MAX_IMPORT_BATCH } from './import-workouts.dto.js';

const workout = {
  title: 'Upper A',
  startedAt: '2026-10-12T07:56:14.000Z',
  durationSeconds: 4152,
  exercises: [{ exerciseId: 1, trackingMode: 'weight_reps', sets: [{ weight: 6, reps: 12 }] }],
};

async function errorsFor(workouts: unknown) {
  const errors = await validate(plainToInstance(ImportWorkoutsDto, { workouts }));
  return errors.map((e) => e.property);
}

describe('ImportWorkoutsDto', () => {
  it('accepts a batch of valid workouts', async () => {
    expect(await errorsFor([workout, workout])).toEqual([]);
  });

  it.each([
    ['an empty batch', []],
    ['more than one batch', Array.from({ length: MAX_IMPORT_BATCH + 1 }, () => workout)],
    ['an invalid workout', [workout, { ...workout, startedAt: '2999-01-01T10:00:00.000Z' }]],
    ['something other than a list', workout],
  ])('rejects %s', async (_label, workouts) => {
    expect(await errorsFor(workouts)).toEqual(['workouts']);
  });
});
