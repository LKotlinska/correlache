import { TrackingMode } from '../../../models/workout.model';

// The shape every app-specific parser produces. Exercise names are still the source app's names:
// matching them to the exercise library is a later step.

/** One set, already converted to kg, km and seconds. */
export interface ImportedSet {
  weight: number | null;
  reps: number | null;
  /** Kilometres */
  distance: number | null;
  durationSeconds: number | null;
  warmup: boolean;
}

export interface ImportedExercise {
  /** As written in the export, with surrounding and repeated spaces removed */
  name: string;
  trackingMode: TrackingMode;
  sets: ImportedSet[];
}

export interface ImportedWorkout {
  title: string;
  /**
   * Local wall-clock time without a timezone, e.g. "2026-11-09T10:53:09". The exports do not say
   * which zone they are in, so the zone is added when saving.
   */
  startedAt: string;
  durationSeconds: number;
  /** In the order they were done */
  exercises: ImportedExercise[];
}

export interface ImportProblem {
  line: number;
  message: string;
}

export interface ImportParseResult {
  /** Oldest first */
  workouts: ImportedWorkout[];
  /** Rows that could not be read. They are left out of `workouts`. */
  problems: ImportProblem[];
  /** Sets with no values at all, e.g. a failure set logged empty. They are left out. */
  emptySetsDropped: number;
}

export type WeightUnit = 'kg' | 'lb';
export type DistanceUnit = 'km' | 'mi';

export interface ImportUnits {
  weight: WeightUnit;
  distance: DistanceUnit;
}

export const DEFAULT_IMPORT_UNITS: ImportUnits = { weight: 'kg', distance: 'km' };

/** The file is not the export it was expected to be, so nothing in it can be read. */
export class ImportFormatError extends Error {
  override name = 'ImportFormatError';
}
