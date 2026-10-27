import { LookupOption } from './headache.model';

export type MuscleRole = 'primary' | 'secondary';

export interface ExerciseMuscle extends LookupOption {
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

export interface CreateWorkoutSetPayload {
    weight: number | null;
    reps: number | null;
}

export interface CreateWorkoutExercisePayload {
    exerciseId: number;
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
