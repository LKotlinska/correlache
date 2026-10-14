import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { User } from '../user/user.entity.js';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { register: vi.fn(), login: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    })
      // The real guard needs ThrottlerModule's storage; its behaviour belongs to e2e tests.
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates registration to the service', async () => {
    const dto = { name: 'Jane', email: 'jane@example.com', password: 'supersecret' };
    authService.register.mockResolvedValue({ id: '1', username: 'Jane', email: dto.email });

    await expect(controller.register(dto)).resolves.toEqual({ id: '1', username: 'Jane', email: dto.email });
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to the service', async () => {
    const dto = { email: 'jane@example.com', password: 'supersecret' };
    authService.login.mockResolvedValue({ id: '1', username: 'Jane', email: dto.email });

    await expect(controller.login(dto)).resolves.toEqual({ id: '1', username: 'Jane', email: dto.email });
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('returns only the public fields of the current user', () => {
    const user = { id: '1', username: 'Jane', email: 'jane@example.com', password_hash: 'secret' } as User;

    expect(controller.me(user)).toEqual({ id: '1', username: 'Jane', email: 'jane@example.com' });
  });
});
