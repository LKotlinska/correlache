import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service.js';
import { WorkoutController } from './workout.controller.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/set.entity.js';
import { Exercise } from './entities/exercise.entity.js';
import { ExerciseMuscle } from './entities/exercise-muscle.entity.js';
import { Equipment } from './lookups/equipment.entity.js';
import { BodyPart } from './lookups/body-part.entity.js';
import { Muscle } from './lookups/muscle.entity.js';
import { MuscleGroup } from './lookups/muscle-group.entity.js';

@Module({
  // autoLoadEntities only picks up entities registered here, and User references Workout
  imports: [
    TypeOrmModule.forFeature([
      Workout,
      WorkoutExercise,
      WorkoutSet,
      Exercise,
      ExerciseMuscle,
      Equipment,
      BodyPart,
      Muscle,
      MuscleGroup,
    ]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
