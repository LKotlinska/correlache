import { Test, TestingModule } from '@nestjs/testing';
import { WorkoutController } from './workout.controller.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity.js';
import { Workout } from './entities/workout.entity.js';
import { WorkoutService } from './workout.service.js';

describe('WorkoutController', () => {
  let controller: WorkoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkoutController],
      providers: [
        WorkoutService,
        { provide: getRepositoryToken(Exercise), useValue: { find: vi.fn() } },
        { provide: getRepositoryToken(Workout), useValue: { manager: { transaction: vi.fn() } } },
      ],
    }).compile();

    controller = module.get<WorkoutController>(WorkoutController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
