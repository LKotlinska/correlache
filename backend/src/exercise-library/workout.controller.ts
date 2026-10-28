import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { User } from '../user/entities/user.entity.js';
import { WorkoutService } from './workout.service.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { ExerciseDto } from './dto/exercise.dto.js';
import { Workout } from './entities/workout.entity.js';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutService.create(user.id, createWorkoutDto);
  }

  @Get('exercises')
  async getExercises(): Promise<ExerciseDto[]> {
    return await this.workoutService.getExercises();
  }

  @Get('')
  async getWorkouts(@CurrentUser() user: User): Promise<Workout[]> {
    return await this.workoutService.getWorkouts(user.id)
  }
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.workoutService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateWorkoutDto: UpdateWorkoutDto) {
  //   return this.workoutService.update(+id, updateWorkoutDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.workoutService.remove(+id);
  // }
}
