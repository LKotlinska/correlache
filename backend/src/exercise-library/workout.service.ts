import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { Exercise } from './entities/exercise.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/set.entity.js';
import { ExerciseDto } from './dto/exercise.dto.js';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Workout) private readonly workoutRepo: Repository<Workout>,
  ) {}

  /** Saves the workout with its exercises and sets in one transaction, so a failure never leaves a half-saved workout. */
  async create(userId: string, dto: CreateWorkoutDto): Promise<Pick<Workout, 'id' | 'title' | 'startedAt' | 'durationSeconds'>> {
    const ids = [...new Set(dto.exercises.map((e) => e.exerciseId))];
    const library = await this.exerciseRepo.find({ where: { id: In(ids) }, select: { id: true, name: true } });
    const namesById = new Map(library.map((e) => [e.id, e.name]));
    const unknown = ids.filter((id) => !namesById.has(id));
    if (unknown.length) throw new BadRequestException(`Unknown exercise id(s): ${unknown.join(', ')}`);

    return this.workoutRepo.manager.transaction(async (manager) => {
      const workout = await manager.save(
        manager.create(Workout, {
          userId,
          title: dto.title.trim(),
          startedAt: new Date(dto.startedAt),
          durationSeconds: dto.durationSeconds,
        }),
      );

      for (const [order, exercise] of dto.exercises.entries()) {
        const workoutExercise = await manager.save(
          manager.create(WorkoutExercise, {
            workoutId: workout.id,
            exerciseId: exercise.exerciseId,
            exerciseName: namesById.get(exercise.exerciseId)!,
            order,
          }),
        );
        // Rows with neither weight nor reps carry no information, so they are not stored
        const sets = exercise.sets
          .filter((set) => set.weight != null || set.reps != null)
          .map((set, setOrder) =>
            manager.create(WorkoutSet, {
              workoutExerciseId: workoutExercise.id,
              order: setOrder,
              weight: set.weight ?? null,
              reps: set.reps ?? null,
            }),
          );
        if (sets.length) await manager.save(sets);
      }

      return { id: workout.id, title: workout.title, startedAt: workout.startedAt, durationSeconds: workout.durationSeconds };
    });
  }

  async getExercises(): Promise<ExerciseDto[]> {
    const exercises = await this.exerciseRepo.find({
      relations: { equipment: true, bodyPart: true, muscles: { muscle: true } },
    });

    return exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      imageName: exercise.imageName,
      gifName: exercise.gifName,
      equipment: { id: exercise.equipment.id, name: exercise.equipment.name },
      bodyPart: { id: exercise.bodyPart.id, name: exercise.bodyPart.name },
      muscles: exercise.muscles.map((em) => ({
        id: em.muscle.id,
        name: em.muscle.name,
        role: em.role,
      })),
    }));
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
  return this.workoutRepo.find({
      where: { userId },
      relations: { exercises: { sets: true } },
      order: {
        startedAt: 'DESC',
        exercises: { order: 'ASC', sets: { order: 'ASC' } },
      },
    });
  }
}
