import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { User } from '../user/user.entity.js';
import { AUTH_COOKIE, authCookieOptions } from './auth-cookie.js';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = { register: vi.fn(), login: vi.fn(), logout: vi.fn() };
  const res = { cookie: vi.fn(), clearCookie: vi.fn() };

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

  it('logs in, sets the auth cookie and returns the user', async () => {
    const dto = { email: 'jane@example.com', password: 'supersecret' };
    const user = { id: '1', username: 'Jane', email: dto.email };
    authService.login.mockResolvedValue({ user, token: 'signed-token' });

    await expect(controller.login(dto, res as never)).resolves.toEqual(user);
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(res.cookie).toHaveBeenCalledWith(AUTH_COOKIE, 'signed-token', authCookieOptions());
  });

  it('revokes the session and clears the auth cookie on logout', async () => {
    authService.logout.mockResolvedValue(undefined);

    await controller.logout({ id: '1' } as User, res as never);

    expect(authService.logout).toHaveBeenCalledWith('1');
    expect(res.clearCookie).toHaveBeenCalledWith(AUTH_COOKIE, expect.objectContaining({ httpOnly: true, path: '/' }));
  });

  it('returns only the public fields of the current user', () => {
    const user = { id: '1', username: 'Jane', email: 'jane@example.com', password_hash: 'secret' } as User;

    expect(controller.me(user)).toEqual({ id: '1', username: 'Jane', email: 'jane@example.com' });
  });
});
