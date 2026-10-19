import { Test, TestingModule } from '@nestjs/testing';
import { HeadacheService } from './headache.service.js';

describe('HeadacheService', () => {
  let service: HeadacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeadacheService],
    }).compile();

    service = module.get<HeadacheService>(HeadacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
