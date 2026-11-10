import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { User } from './entities/user.entity.js';

describe('UserController', () => {
  let controller: UserController;
  const userService = { giveConsent: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('records health data consent for the current user', async () => {
    userService.giveConsent.mockResolvedValue(undefined);

    await controller.giveConsent({ id: 'uuid-1' } as User);

    expect(userService.giveConsent).toHaveBeenCalledWith('uuid-1');
  });
});
