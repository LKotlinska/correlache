import { Test, TestingModule } from '@nestjs/testing';
import { HeadacheController } from './headache.controller.js';
import { HeadacheService } from './headache.service.js';

describe('HeadacheController', () => {
  let controller: HeadacheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeadacheController],
      providers: [HeadacheService],
    }).compile();

    controller = module.get<HeadacheController>(HeadacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
