import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';
import { Exercise } from './entities/exercise.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/set.entity.js';
import { ExerciseDto, ExerciseMuscleDto, WorkoutDetailDto } from './dto/exercise.dto.js';
import { TRACKED_FIELDS } from './tracking-mode.js';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectRepository(Exercise) private readonly exerciseRepo: Repository<Exercise>,
    @InjectRepository(Workout) private readonly workoutRepo: Repository<Workout>,
  ) {}

  /** Saves the workout with its exercises and sets in one transaction, so a failure never leaves a half-saved workout. */
  async create(userId: string, dto: CreateWorkoutDto): Promise<Pick<Workout, 'id' | 'title' | 'startedAt' | 'durationSeconds'>> {
    const namesById = await this.findExerciseNames(dto);

    return this.workoutRepo.manager.transaction(async (manager) => {
      const workout = await manager.save(manager.create(Workout, { userId, ...this.ownFields(dto) }));
      await this.saveExercises(manager, workout.id, dto, namesById);
      return this.summary(workout);
    });
  }

  /** Replaces all of a workout's fields, exercises and sets with `dto`, throwing a 404 if it isn't the user's. */
  async update(userId: string, id: string, dto: CreateWorkoutDto): Promise<Pick<Workout, 'id' | 'title' | 'startedAt' | 'durationSeconds'>> {
    const namesById = await this.findExerciseNames(dto);

    return this.workoutRepo.manager.transaction(async (manager) => {
      const workout = await manager.findOne(Workout, { where: { id, userId } });
      if (!workout) throw new NotFoundException(`Workout ${id} not found`);

      Object.assign(workout, this.ownFields(dto));
      await manager.save(workout);
      // Sets are removed with their exercise (cascade), then rebuilt from the form
      await manager.delete(WorkoutExercise, { workoutId: id });
      await this.saveExercises(manager, id, dto, namesById);
      return this.summary(workout);
    });
  }

  /** Deletes the workout with its exercises and sets (cascade), throwing a 404 if it isn't the user's. */
  async remove(userId: string, id: string): Promise<void> {
    const { affected } = await this.workoutRepo.delete({ id, userId });
    if (!affected) throw new NotFoundException(`Workout ${id} not found`);
  }

  /** Looks up the library names of the exercises in `dto`, throwing a 400 when any id does not exist. */
  private async findExerciseNames(dto: CreateWorkoutDto): Promise<Map<number, string>> {
    const ids = [...new Set(dto.exercises.map((e) => e.exerciseId))];
    const library = await this.exerciseRepo.find({ where: { id: In(ids) }, select: { id: true, name: true } });
    const namesById = new Map(library.map((e) => [e.id, e.name]));
    const unknown = ids.filter((id) => !namesById.has(id));
    if (unknown.length) throw new BadRequestException(`Unknown exercise id(s): ${unknown.join(', ')}`);
    return namesById;
  }

  private ownFields(dto: CreateWorkoutDto) {
    return { title: dto.title.trim(), startedAt: new Date(dto.startedAt), durationSeconds: dto.durationSeconds };
  }

  private summary({ id, title, startedAt, durationSeconds }: Workout) {
    return { id, title, startedAt, durationSeconds };
  }

  private async saveExercises(manager: EntityManager, workoutId: string, dto: CreateWorkoutDto, namesById: Map<number, string>) {
    for (const [order, exercise] of dto.exercises.entries()) {
      const workoutExercise = await manager.save(
        manager.create(WorkoutExercise, {
          workoutId,
          exerciseId: exercise.exerciseId,
          exerciseName: namesById.get(exercise.exerciseId)!,
          order,
          trackingMode: exercise.trackingMode,
        }),
      );
      // Only the fields the mode tracks are kept, so later volume maths never sees stray values.
      // Rows left with nothing carry no information, so they are not stored.
      const tracked = TRACKED_FIELDS[exercise.trackingMode];
      const sets = exercise.sets
        .map((set) => ({
          weight: tracked.weight ? (set.weight ?? null) : null,
          reps: tracked.reps ? (set.reps ?? null) : null,
          distance: tracked.distance ? (set.distance ?? null) : null,
          durationSeconds: tracked.durationSeconds ? (set.durationSeconds ?? null) : null,
        }))
        .filter((set) => Object.values(set).some((value) => value != null))
        .map((set, setOrder) =>
          manager.create(WorkoutSet, { workoutExerciseId: workoutExercise.id, order: setOrder, ...set }),
        );
      if (sets.length) await manager.save(sets);
    }
  }

  async getExercises(): Promise<ExerciseDto[]> {
    const exercises = await this.exerciseRepo.find({
      relations: { equipment: true, bodyPart: true, muscles: { muscle: { muscleGroup: true } } },
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
        muscleGroup: { id: em.muscle.muscleGroup.id, name: em.muscle.muscleGroup.name },
        role: em.role,
      })),
    }));
  }

  async getWorkouts(userId: string): Promise<Workout[]> {
  return await this.workoutRepo.find({
      where: { userId },
      relations: { exercises: { sets: true } },
      order: {
        startedAt: 'DESC',
        exercises: { order: 'ASC', sets: { order: 'ASC' } },
      },
    });
  }

  /** Returns the workout with each exercise's muscles from the library. Exercises no longer in the library get an empty list. */
  async getWorkoutById(userId: string, id: string): Promise<WorkoutDetailDto> {
    const workout = await this.workoutRepo.findOne({
      where: { userId, id },
      relations: { exercises: { sets: true } },
      order: {
        exercises: { order: 'ASC', sets: { order: 'ASC' } },
      },
    });
    if (!workout) throw new NotFoundException(`Workout ${id} not found`);

    const exerciseIds = workout.exercises.flatMap((e) => (e.exerciseId == null ? [] : [e.exerciseId]));
    const libraryExercises = exerciseIds.length
      ? await this.exerciseRepo.find({
          where: { id: In(exerciseIds) },
          relations: { muscles: { muscle: { muscleGroup: true } } },
        })
      : [];

    const musclesByExerciseId = new Map<number, ExerciseMuscleDto[]>();
    for (const exercise of libraryExercises) {
      musclesByExerciseId.set(
        exercise.id,
        exercise.muscles.map((em) => ({
          id: em.muscle.id,
          name: em.muscle.name,
          muscleGroup: { id: em.muscle.muscleGroup.id, name: em.muscle.muscleGroup.name },
          role: em.role,
        })),
      );
    }

    return {
      ...workout,
      exercises: workout.exercises.map((e) => ({
        ...e,
        muscles: musclesByExerciseId.get(e.exerciseId ?? -1) ?? [],
      })),
    };
  }
}
