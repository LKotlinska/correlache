import { MuscleRole } from '../entities/exercise-muscle.entity.js';
import { Workout } from '../entities/workout.entity.js';
import { WorkoutExercise } from '../entities/workout-exercise.entity.js';

export class LookupDto {
    id: number;
    name: string;
}

export class ExerciseMuscleDto {
    id: number;
    name: string;
    muscleGroup: LookupDto;
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

export class WorkoutExerciseDetailDto extends WorkoutExercise {
    muscles: ExerciseMuscleDto[];
}

export class WorkoutDetailDto extends Workout {
    declare exercises: WorkoutExerciseDetailDto[];
}
