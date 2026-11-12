import { Controller, Get, Post, Body, Put, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, ParseDatePipe, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { HealthConsentGuard } from '../user/health-consent.guard.js';
import { User } from '../user/entities/user.entity.js';
import { WorkoutService } from './workout.service.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { ExerciseDto } from './dto/exercise.dto.js';
import { Workout } from './entities/workout.entity.js';
import { assertOrderedRange } from '../common/validators/ordered-range.js';

@Controller('workout')
@UseGuards(HealthConsentGuard)
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
  async getWorkouts(
    @CurrentUser() user: User,
    @Query('from', new ParseDatePipe({ optional: true })) from?: Date,
    @Query('to', new ParseDatePipe({ optional: true })) to?: Date,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<Workout[]> {
    assertOrderedRange(from, to);
    return await this.workoutService.getWorkouts(user.id, from, to, limit);
  }

  @Get(':id')
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.workoutService.getWorkoutById(user.id, id);
  }

  @Put(':id')
  update(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateWorkoutDto) {
    return this.workoutService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.workoutService.remove(user.id, id);
  }
}
