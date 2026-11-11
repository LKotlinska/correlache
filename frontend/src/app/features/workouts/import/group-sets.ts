import { TrackingMode } from '../../../models/workout.model';
import { TRACKED_FIELDS } from '../../../utils/tracking-mode';
import { ImportedExercise, ImportedSet, ImportedWorkout } from './imported-workout';

/**
 * One row of an export: a single set, with the details of the workout and exercise it belongs to.
 * The exports this app reads all write one row per set and repeat the workout's details on each.
 */
export interface SetRow {
  workoutTitle: string;
  /** Local time, e.g. "2026-11-09T10:53:09" */
  startedAt: string;
  workoutDurationSeconds: number;
  exerciseName: string;
  set: ImportedSet;
}

interface WorkoutInProgress {
  title: string;
  startedAt: string;
  durationSeconds: number;
  /** Map order is the order each exercise first appears in */
  setsByExercise: Map<string, ImportedSet[]>;
}

/**
 * Builds workouts from set rows, oldest first. Rows belong to the same workout when they share its
 * start and title; the title alone is not enough, as names like "Upper A" repeat across days.
 */
export function groupIntoWorkouts(rows: SetRow[]): ImportedWorkout[] {
  const workouts = new Map<string, WorkoutInProgress>();

  for (const row of rows) {
    const key = `${row.startedAt} ${row.workoutTitle}`;
    let workout = workouts.get(key);
    if (!workout) {
      workout = {
        title: row.workoutTitle,
        startedAt: row.startedAt,
        durationSeconds: row.workoutDurationSeconds,
        setsByExercise: new Map(),
      };
      workouts.set(key, workout);
    }

    const sets = workout.setsByExercise.get(row.exerciseName);
    if (sets) sets.push(row.set);
    else workout.setsByExercise.set(row.exerciseName, [row.set]);
  }

  return [...workouts.values()]
    .map(({ setsByExercise, ...workout }) => ({
      ...workout,
      exercises: [...setsByExercise].map(([name, sets]) => toExercise(name, sets)),
    }))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** True when a set has no values at all. Zero counts as no value: Lyfta writes weight 0 on unweighted sets. */
export function isEmptySet(set: ImportedSet): boolean {
  return !set.weight && !set.reps && !set.distance && !set.durationSeconds;
}

/** Exports do not say what an exercise tracks, so it is worked out from which values its sets have. */
export function inferTrackingMode(sets: ImportedSet[]): TrackingMode {
  if (sets.some((set) => set.distance)) return 'duration_distance';
  if (sets.some((set) => set.durationSeconds)) return 'duration';
  if (sets.some((set) => set.weight)) return 'weight_reps';
  return 'reps';
}

function toExercise(name: string, sets: ImportedSet[]): ImportedExercise {
  const trackingMode = inferTrackingMode(sets);
  return { name, trackingMode, sets: sets.map((set) => keepTrackedFields(set, trackingMode)) };
}

// Clears values the mode does not measure, e.g. the weight 0 on a crunch tracked as reps only
function keepTrackedFields(set: ImportedSet, mode: TrackingMode): ImportedSet {
  const tracked = TRACKED_FIELDS[mode];
  return {
    weight: tracked.weight ? set.weight : null,
    reps: tracked.reps ? set.reps : null,
    distance: tracked.distance ? set.distance : null,
    durationSeconds: tracked.duration ? set.durationSeconds : null,
    warmup: set.warmup,
  };
}
