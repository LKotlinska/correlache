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
