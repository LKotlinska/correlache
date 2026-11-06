import { Workout, WorkoutExercise } from '../../models/workout.model';
import { loadRatio, personalBests } from './training-load';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-11-05T10:00:00Z');

const exercise = (weight: number | null, reps = 8, exerciseId = 1): WorkoutExercise => ({
  id: crypto.randomUUID(),
  exerciseId,
  exerciseName: 'bench press',
  order: 0,
  trackingMode: 'weight_reps',
  sets: [{ id: crypto.randomUUID(), order: 0, weight, reps, distance: null, durationSeconds: null }],
});

const workout = (daysAgo: number, minutes = 60, exercises: WorkoutExercise[] = []): Workout => ({
  id: crypto.randomUUID(),
  title: 'Workout',
  startedAt: new Date(now - daysAgo * DAY_MS).toISOString(),
  durationSeconds: minutes * 60,
  exercises,
});

describe('loadRatio', () => {
  // Two 60-minute workouts a week for four weeks: 120 minutes in a usual week
  const steady = [0, 3, 7, 10, 14, 17, 21, 24].map(d => workout(d));

  it('is 1 for steady training', () => {
    expect(loadRatio(now, [...steady, workout(30)])).toBeCloseTo(1, 5);
  });

  it('is above 1 when the last week was busier', () => {
    expect(loadRatio(now, [...steady, workout(1, 120), workout(30)])!).toBeGreaterThan(1.3);
  });

  it('is null without four weeks of history', () => {
    expect(loadRatio(now, steady)).toBeNull();
  });
});

describe('personalBests', () => {
  it('finds an exercise beating its earlier sessions', () => {
    const history = [workout(20, 60, [exercise(40)]), workout(10, 60, [exercise(42.5)])];
    expect(personalBests(workout(0, 60, [exercise(45)]), history)).toEqual(['bench press']);
    expect(personalBests(workout(0, 60, [exercise(42.5)]), history)).toEqual([]);
  });

  it('needs two earlier sessions', () => {
    expect(personalBests(workout(0, 60, [exercise(45)]), [workout(10, 60, [exercise(40)])])).toEqual([]);
  });

  it('ignores sessions older than the lookback', () => {
    const history = [workout(200, 60, [exercise(60)]), workout(20, 60, [exercise(40)]), workout(10, 60, [exercise(40)])];
    expect(personalBests(workout(0, 60, [exercise(45)]), history)).toEqual(['bench press']);
  });

  it('compares reps for weight and reps exercises logged without weight', () => {
    const history = [workout(20, 60, [exercise(null, 8)]), workout(10, 60, [exercise(null, 10)])];
    expect(personalBests(workout(0, 60, [exercise(null, 12)]), history)).toEqual(['bench press']);
  });
});
