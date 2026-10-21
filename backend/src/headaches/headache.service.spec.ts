import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HeadacheService } from './headache.service.js';
import { Headache } from './entities/headache.entity.js';
import { Trigger } from './lookups/trigger.entity.js';
import { Symptom } from './lookups/symptom.entity.js';
import { ReliefMeasure } from './lookups/relief-measure.entity.js';
import { HeadacheLocation } from './lookups/headache-location.entity.js';

describe('HeadacheService', () => {
  let service: HeadacheService;
  const headacheRepo = {
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => ({ ...x, id: 'h1' })),
    findOneOrFail: vi.fn(async () => ({ id: 'h1' })),
  };
  const lookupRepo = () => ({ find: vi.fn(async () => [{ id: 1 }]) });
  const triggerRepo = lookupRepo();

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HeadacheService,
        { provide: getRepositoryToken(Headache), useValue: headacheRepo },
        { provide: getRepositoryToken(Trigger), useValue: triggerRepo },
        { provide: getRepositoryToken(Symptom), useValue: lookupRepo() },
        { provide: getRepositoryToken(ReliefMeasure), useValue: lookupRepo() },
        { provide: getRepositoryToken(HeadacheLocation), useValue: lookupRepo() },
      ],
    }).compile();

    service = module.get(HeadacheService);
  });

  const dto = {
    startedAt: '2026-01-01T10:00:00.000Z',
    painLevel: 5,
    notes: '  ',
    locationIds: [1],
    triggerIds: [1],
    symptomIds: [1],
    reliefIds: [1],
  };

  it('stores blank notes as null and returns the slim row', async () => {
    const result = await service.create('u1', dto);
    expect(headacheRepo.create).toHaveBeenCalledWith(expect.objectContaining({ notes: null, userId: 'u1' }));
    expect(result).toEqual({ id: 'h1' });
  });

  it('throws 400 when a lookup id does not exist', async () => {
    await expect(service.create('u1', { ...dto, triggerIds: [1, 999] })).rejects.toThrow(BadRequestException);
    expect(headacheRepo.save).not.toHaveBeenCalled();
  });
});
