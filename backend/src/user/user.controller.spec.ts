import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

describe('UserController', () => {
  let controller: UserController;
  const userService = { create: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates creation to the service', async () => {
    const dto = { name: 'Jane', email: 'jane@example.com', password: 'supersecret' };
    userService.create.mockResolvedValue({ id: '1', username: 'Jane', email: dto.email });

    await expect(controller.create(dto)).resolves.toEqual({
      id: '1',
      username: 'Jane',
      email: dto.email,
    });
    expect(userService.create).toHaveBeenCalledWith(dto);
  });
});
