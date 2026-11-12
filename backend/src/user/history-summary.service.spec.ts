import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HistorySummaryService } from './history-summary.service.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { Workout } from '../exercise-library/entities/workout.entity.js';

describe('HistorySummaryService', () => {
  let service: HistorySummaryService;

  const queryReturning = (raw: unknown) => {
    const qb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getRawOne: vi.fn().mockResolvedValue(raw),
    };
    return qb;
  };
  const headacheRepo = { createQueryBuilder: vi.fn() };
  const workoutRepo = { createQueryBuilder: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistorySummaryService,
        { provide: getRepositoryToken(Headache), useValue: headacheRepo },
        { provide: getRepositoryToken(Workout), useValue: workoutRepo },
      ],
    }).compile();
    service = module.get(HistorySummaryService);
  });

  it('counts each source for the user only and returns its first start as a Date', async () => {
    const headacheQuery = queryReturning({ count: '12', first: new Date('2026-01-05T08:00:00Z') });
    const workoutQuery = queryReturning({ count: '3', first: '2026-02-01 10:00:00' });
    headacheRepo.createQueryBuilder.mockReturnValue(headacheQuery);
    workoutRepo.createQueryBuilder.mockReturnValue(workoutQuery);

    const result = await service.summarize('uuid-1');

    expect(result.headaches).toEqual({ count: 12, firstStartedAt: new Date('2026-01-05T08:00:00Z') });
    expect(result.workouts.count).toBe(3);
    expect(result.workouts.firstStartedAt).toBeInstanceOf(Date);
    for (const qb of [headacheQuery, workoutQuery]) {
      expect(qb.where).toHaveBeenCalledWith('entry.userId = :userId', { userId: 'uuid-1' });
    }
  });

  it('reports no entries as a zero count without a first date', async () => {
    headacheRepo.createQueryBuilder.mockReturnValue(queryReturning({ count: '0', first: null }));
    workoutRepo.createQueryBuilder.mockReturnValue(queryReturning(undefined));

    await expect(service.summarize('uuid-1')).resolves.toEqual({
      headaches: { count: 0, firstStartedAt: null },
      workouts: { count: 0, firstStartedAt: null },
    });
  });
});
