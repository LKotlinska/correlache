import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkoutService } from './workout.service.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { ExerciseDto } from './dto/exercise.dto.js';

@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post()
  create(@Body() createWorkoutDto: CreateWorkoutDto) {
    return this.workoutService.create(createWorkoutDto);
  }

  @Get()
  async getExercises(): Promise<ExerciseDto[]> {
    return await this.workoutService.getExercises();
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
