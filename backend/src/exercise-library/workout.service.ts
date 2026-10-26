import { Injectable } from '@nestjs/common';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { UpdateWorkoutDto } from './dto/update-workout.dto.js';
import { Exercise } from './entities/exercise.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseDto } from './dto/exercise.dto.js';

@Injectable()
export class WorkoutService {
  @InjectRepository(Exercise)
  private readonly exerciseRepo: Repository<Exercise>

  create(createWorkoutDto: CreateWorkoutDto) {
    return 'This action adds a new workout';
  }

  async getExercises(): Promise<ExerciseDto[]> {
    const exercises = await this.exerciseRepo.find({
      relations: { equipment: true, bodyPart: true, muscles: { muscle: true } },
    });

    return exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      imageName: exercise.imageName,
      exerciseType: exercise.exerciseType,
      equipment: { id: exercise.equipment.id, name: exercise.equipment.name },
      bodyPart: { id: exercise.bodyPart.id, name: exercise.bodyPart.name },
      muscles: exercise.muscles.map((em) => ({
        id: em.muscle.id,
        name: em.muscle.name,
        role: em.role,
      })),
    }));
  }
}
