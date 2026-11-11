import { groupIntoWorkouts, inferTrackingMode, isEmptySet, SetRow } from './group-sets';
import { ImportedSet } from './imported-workout';

type SetValues = Partial<Omit<ImportedSet, 'warmup'>>;

const set = (values: SetValues, warmup = false): ImportedSet => ({
  weight: null,
  reps: null,
  distance: null,
  durationSeconds: null,
  ...values,
  warmup,
});

const row = (
  workoutTitle: string,
  startedAt: string,
  exerciseName: string,
  values: SetValues,
): SetRow => ({
  workoutTitle,
  startedAt,
  workoutDurationSeconds: 3600,
  exerciseName,
  set: set(values),
});

describe('groupIntoWorkouts', () => {
  it('splits workouts that share a title but not a start, oldest first', () => {
    const workouts = groupIntoWorkouts([
      row('Upper A', '2026-10-12T09:56:14', 'Biceps Curl', { weight: 5, reps: 10 }),
      row('Upper A', '2026-10-02T11:26:19', 'Biceps Curl', { weight: 4, reps: 12 }),
    ]);
    expect(workouts.map((w) => [w.title, w.startedAt])).toEqual([
      ['Upper A', '2026-10-02T11:26:19'],
      ['Upper A', '2026-10-12T09:56:14'],
    ]);
  });

  it('keeps exercises in the order they first appear, collecting their sets', () => {
    const [workout] = groupIntoWorkouts([
      row('Upper A', '2026-10-12T09:56:14', 'Incline Bench Press', { weight: 6, reps: 12 }),
      row('Upper A', '2026-10-12T09:56:14', 'Biceps Curl', { weight: 5, reps: 10 }),
      row('Upper A', '2026-10-12T09:56:14', 'Incline Bench Press', { weight: 6, reps: 10 }),
    ]);
    expect(workout.exercises.map((e) => [e.name, e.sets.length])).toEqual([
      ['Incline Bench Press', 2],
      ['Biceps Curl', 1],
    ]);
  });

  it('clears values the tracking mode does not measure', () => {
    const [workout] = groupIntoWorkouts([
      row('Lower B', '2026-10-19T10:34:15', 'Crunch Floor', { weight: 0, reps: 30 }),
    ]);
    expect(workout.exercises[0]).toEqual({
      name: 'Crunch Floor',
      trackingMode: 'reps',
      sets: [set({ reps: 30 })],
    });
  });
});

describe('inferTrackingMode', () => {
  it('prefers distance, then time, then weight', () => {
    expect(inferTrackingMode([set({ durationSeconds: 60 }), set({ distance: 1 })])).toBe(
      'duration_distance',
    );
    expect(inferTrackingMode([set({ reps: 10 }), set({ durationSeconds: 60 })])).toBe('duration');
    expect(inferTrackingMode([set({ reps: 10 }), set({ weight: 5, reps: 8 })])).toBe('weight_reps');
    expect(inferTrackingMode([set({ reps: 10 })])).toBe('reps');
  });
});

describe('isEmptySet', () => {
  it('treats zero as no value', () => {
    expect(isEmptySet(set({}))).toBe(true);
    expect(isEmptySet(set({ weight: 0 }))).toBe(true);
    expect(isEmptySet(set({ reps: 1 }))).toBe(false);
  });
});
