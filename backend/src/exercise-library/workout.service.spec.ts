import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutExercise } from './entities/workout-exercise.entity.js';
import { WorkoutSet } from './entities/set.entity.js';
import { WorkoutService } from './workout.service.js';
import { CreateWorkoutDto } from './dto/create-workout.dto.js';

describe('WorkoutService', () => {
  let service: WorkoutService;
  let exerciseRepo: { find: ReturnType<typeof vi.fn> };
  let workoutRepo: { delete: ReturnType<typeof vi.fn>; manager: unknown };
  let manager: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const dto: CreateWorkoutDto = {
    title: '  Push day ',
    startedAt: '2026-10-27T10:00:00.000Z',
    durationSeconds: 3600,
    exercises: [
      { exerciseId: 7, trackingMode: 'weight_reps', sets: [{ weight: 50, reps: 8 }, { weight: null, reps: null }, { weight: null, reps: 12 }] },
      { exerciseId: 3, trackingMode: 'weight_reps', sets: [] },
    ],
  };

  beforeEach(async () => {
    exerciseRepo = { find: vi.fn().mockResolvedValue([{ id: 7, name: 'Bench press' }, { id: 3, name: 'Squat' }]) };
    let nextId = 0;
    manager = {
      create: vi.fn((_entity, data) => ({ ...data })),
      save: vi.fn(async (data) => (Array.isArray(data) ? data : { ...data, id: data.id ?? `id-${++nextId}` })),
      findOne: vi.fn().mockResolvedValue({ id: 'w-1', userId: 'user-1', title: 'Old', startedAt: new Date(0), durationSeconds: 1 }),
      delete: vi.fn().mockResolvedValue({ affected: 2 }),
    };
    workoutRepo = {
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      manager: { transaction: (fn: (m: unknown) => unknown) => fn(manager) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        { provide: getRepositoryToken(Exercise), useValue: exerciseRepo },
        { provide: getRepositoryToken(Workout), useValue: workoutRepo },
      ],
    }).compile();

    service = module.get<WorkoutService>(WorkoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('saves the workout for the user with names from the library and ordered, non-empty sets', async () => {
    const result = await service.create('user-1', dto);

    expect(result).toMatchObject({ id: 'id-1', title: 'Push day', durationSeconds: 3600 });
    const created = manager.create.mock.calls;
    expect(created[0]).toEqual([Workout, expect.objectContaining({ userId: 'user-1', title: 'Push day' })]);
    expect(created[1]).toEqual([WorkoutExercise, expect.objectContaining({ exerciseId: 7, exerciseName: 'Bench press', order: 0 })]);
    // the empty set row is dropped and the rest are renumbered
    expect(created[2]).toEqual([WorkoutSet, expect.objectContaining({ order: 0, weight: 50, reps: 8 })]);
    expect(created[3]).toEqual([WorkoutSet, expect.objectContaining({ order: 1, weight: null, reps: 12 })]);
    expect(created[4]).toEqual([WorkoutExercise, expect.objectContaining({ exerciseId: 3, exerciseName: 'Squat', order: 1 })]);
  });

  it('keeps only the fields the tracking mode uses', async () => {
    await service.create('user-1', {
      ...dto,
      exercises: [
        { exerciseId: 7, trackingMode: 'duration_distance', sets: [{ weight: 50, reps: 8, distance: 2.5, durationSeconds: 1800 }, { weight: 20, reps: 5 }] },
        { exerciseId: 3, trackingMode: 'reps', sets: [{ weight: 10, reps: 12, durationSeconds: 60 }] },
      ],
    });

    const created = manager.create.mock.calls;
    expect(created[1]).toEqual([WorkoutExercise, expect.objectContaining({ trackingMode: 'duration_distance' })]);
    // the second set only had fields this mode ignores, so it is dropped
    expect(created[2]).toEqual([WorkoutSet, expect.objectContaining({ order: 0, weight: null, reps: null, distance: 2.5, durationSeconds: 1800 })]);
    expect(created[3]).toEqual([WorkoutExercise, expect.objectContaining({ trackingMode: 'reps' })]);
    expect(created[4]).toEqual([WorkoutSet, expect.objectContaining({ order: 0, weight: null, reps: 12, distance: null, durationSeconds: null })]);
    expect(created).toHaveLength(5);
  });

  it('rejects exercise ids that are not in the library without saving anything', async () => {
    exerciseRepo.find.mockResolvedValue([{ id: 7, name: 'Bench press' }]);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  describe('update', () => {
    it('replaces the workout fields, exercises and sets', async () => {
      const result = await service.update('user-1', 'w-1', dto);

      expect(manager.findOne).toHaveBeenCalledWith(Workout, { where: { id: 'w-1', userId: 'user-1' } });
      expect(result).toMatchObject({ id: 'w-1', title: 'Push day', durationSeconds: 3600 });
      expect(manager.delete).toHaveBeenCalledWith(WorkoutExercise, { workoutId: 'w-1' });
      const created = manager.create.mock.calls;
      expect(created[0]).toEqual([WorkoutExercise, expect.objectContaining({ workoutId: 'w-1', exerciseId: 7, order: 0 })]);
      expect(created[1]).toEqual([WorkoutSet, expect.objectContaining({ order: 0, weight: 50, reps: 8 })]);
    });

    it('throws a 404 without changing anything when the workout is not the user\'s', async () => {
      manager.findOne.mockResolvedValue(null);

      await expect(service.update('user-1', 'w-1', dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.delete).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('rejects unknown exercise ids before touching the workout', async () => {
      exerciseRepo.find.mockResolvedValue([{ id: 7, name: 'Bench press' }]);

      await expect(service.update('user-1', 'w-1', dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.delete).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the user\'s workout', async () => {
      await service.remove('user-1', 'w-1');

      expect(workoutRepo.delete).toHaveBeenCalledWith({ id: 'w-1', userId: 'user-1' });
    });

    it('throws a 404 when the workout is not the user\'s', async () => {
      workoutRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('user-1', 'w-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
