import { Module } from '@nestjs/common';
import { WorkoutService } from './workout.service.js';
import { WorkoutController } from './workout.controller.js';

@Module({
  controllers: [WorkoutController],
  providers: [WorkoutService],
})
export class WorkoutModule {}
