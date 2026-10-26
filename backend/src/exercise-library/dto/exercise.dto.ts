import { ExerciseType } from '../entities/exercise.entity.js';
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
    exerciseType: ExerciseType;
    equipment: LookupDto;
    bodyPart: LookupDto;
    muscles: ExerciseMuscleDto[];
}
