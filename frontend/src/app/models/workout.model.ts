import { LookupOption } from './headache.model';

export type MuscleRole = 'primary' | 'secondary';

export interface ExerciseMuscle extends LookupOption {
  muscleGroup: LookupOption;
  role: MuscleRole;
}

// Mirrors the backend ExerciseDto returned by GET /api/workout/exercises
export interface Exercise {
  id: number;
  name: string;
  imageName: string | null;
  gifName: string | null;
  equipment: LookupOption;
  bodyPart: LookupOption;
  muscles: ExerciseMuscle[];
}

/** What is measured for an exercise in a workout. Mirrors TRACKING_MODES in the backend. */
export type TrackingMode = 'weight_reps' | 'reps' | 'duration' | 'duration_distance';

export interface CreateWorkoutSetPayload {
  weight: number | null;
  reps: number | null;
  /** Kilometres */
  distance: number | null;
  durationSeconds: number | null;
}

export interface CreateWorkoutExercisePayload {
  exerciseId: number;
  trackingMode: TrackingMode;
  sets: CreateWorkoutSetPayload[];
}

// Mirrors CreateWorkoutDto in the backend. Array order is the exercise and set order.
export interface CreateWorkoutPayload {
  title: string;
  /** ISO 8601 timestamp */
  startedAt: string;
  durationSeconds: number;
  exercises: CreateWorkoutExercisePayload[];
}

/** Most workouts POST /workout/import takes at once. Mirrors MAX_IMPORT_BATCH in the backend. */
export const IMPORT_BATCH_SIZE = 20;

// Mirrors ImportWorkoutsResultDto in the backend
export interface ImportWorkoutsResult {
  imported: number;
  /** Already saved with the same start and title */
  skipped: number;
}

export interface WorkoutSet {
  id: string;
  order: number;
  weight: number | null;
  reps: number | null;
  distance: number | null;
  durationSeconds: number | null;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: number;
  exerciseName: string;
  order: number;
  trackingMode: TrackingMode;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
}

// Mirrors WorkoutDetailDto, returned by GET /api/workout/:id
export interface WorkoutExerciseDetail extends WorkoutExercise {
  equipment: LookupOption | null;
  muscles: ExerciseMuscle[];
  volume: ExerciseVolume;
}

export interface WorkoutDetail extends Workout {
  exercises: WorkoutExerciseDetail[];
}

export interface ExerciseVolume {
  primary: { value: number; unit: VolumeUnit };
  totalReps: number;
  totalDistanceKm: number;
  totalSeconds: number;
  avgSpeedKmh: number | null;
}

export type VolumeUnit = 'kg' | 'reps' | 'seconds' | 'km';
