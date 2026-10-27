import { BadRequestException } from '@nestjs/common';
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
  let manager: { create: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  const dto: CreateWorkoutDto = {
    title: '  Push day ',
    startedAt: '2026-10-27T10:00:00.000Z',
    durationSeconds: 3600,
    exercises: [
      { exerciseId: 7, sets: [{ weight: 50, reps: 8 }, { weight: null, reps: null }, { weight: null, reps: 12 }] },
      { exerciseId: 3, sets: [] },
    ],
  };

  beforeEach(async () => {
    exerciseRepo = { find: vi.fn().mockResolvedValue([{ id: 7, name: 'Bench press' }, { id: 3, name: 'Squat' }]) };
    let nextId = 0;
    manager = {
      create: vi.fn((_entity, data) => ({ ...data })),
      save: vi.fn(async (data) => (Array.isArray(data) ? data : { ...data, id: `id-${++nextId}` })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkoutService,
        { provide: getRepositoryToken(Exercise), useValue: exerciseRepo },
        { provide: getRepositoryToken(Workout), useValue: { manager: { transaction: (fn: (m: unknown) => unknown) => fn(manager) } } },
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

  it('rejects exercise ids that are not in the library without saving anything', async () => {
    exerciseRepo.find.mockResolvedValue([{ id: 7, name: 'Bench press' }]);

    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });
});
