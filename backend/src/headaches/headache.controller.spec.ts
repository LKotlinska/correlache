import { Test, TestingModule } from '@nestjs/testing';
import { HeadacheController } from './headache.controller.js';
import { HeadacheService } from './headache.service.js';

describe('HeadacheController', () => {
  let controller: HeadacheController;
  const service = { create: vi.fn(async () => ({ id: 'h1' })), getOptions: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeadacheController],
      providers: [{ provide: HeadacheService, useValue: service }],
    }).compile();

    controller = module.get<HeadacheController>(HeadacheController);
  });

  it('passes the current user id to the service', async () => {
    const dto = {} as never;
    await controller.create({ id: 'u1' } as never, dto);
    expect(service.create).toHaveBeenCalledWith('u1', dto);
  });
});
