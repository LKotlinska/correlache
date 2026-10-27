import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutService } from './workout.service.js';
import { WorkoutController } from './workout.controller.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/set.entity.js';
import { Exercise } from './entities/exercise.entity.js';
import { ExerciseMuscle } from './entities/exercise-muscle.entity.js';
import { Muscle } from './lookups/muscle.entity.js';
import { MuscleGroup } from './lookups/muscle-group.entity.js';
import { BodyPart } from './lookups/body-part.entity.js';
import { Equipment } from './lookups/equipment.entity.js';

@Module({
  // autoLoadEntities only picks up entities listed in a forFeature; User references Workout, so all of these must be registered.
  imports: [
    TypeOrmModule.forFeature([
      Workout,
      WorkoutExercise,
      WorkoutSet,
      Exercise,
      ExerciseMuscle,
      Muscle,
      MuscleGroup,
      BodyPart,
      Equipment,
    ]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
