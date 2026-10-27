import { MuscleRole } from '../entities/exercise-muscle.entity.js';

export class LookupDto {
    id: number;
    name: string;
}

export class ExerciseMuscleDto {
    id: number;
    name: string;
    role: MuscleRole;
}

export class ExerciseDto {
    id: number;
    name: string;
    imageName: string | null;
    gifName: string | null;
    equipment: LookupDto;
    bodyPart: LookupDto;
    muscles: ExerciseMuscleDto[];
}
