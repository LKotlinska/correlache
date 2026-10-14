import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SignInService } from '@nestjs/authentication';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { hashPassword } from '../common/password.js';

describe('AuthService', () => {
  let service: AuthService;
  const userService = { create: vi.fn(), findCredentials: vi.fn() };
  const signInService = { signIn: vi.fn() };

  const credentials = { email: 'jane@example.com', password: 'supersecret' };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: SignInService, useValue: signInService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('delegates registration to the user service', async () => {
    const dto = { name: 'Jane', ...credentials };
    userService.create.mockResolvedValue({ id: '1', username: 'Jane', email: dto.email });

    await expect(service.register(dto)).resolves.toEqual({ id: '1', username: 'Jane', email: dto.email });
    expect(userService.create).toHaveBeenCalledWith(dto);
  });

  it('signs in and returns the user without the hash on valid credentials', async () => {
    userService.findCredentials.mockResolvedValue({
      id: 'uuid-1',
      username: 'Jane',
      email: credentials.email,
      password_hash: await hashPassword(credentials.password),
    });

    const result = await service.login(credentials);

    expect(result).toEqual({ id: 'uuid-1', username: 'Jane', email: credentials.email });
    expect(signInService.signIn).toHaveBeenCalledWith('uuid-1');
  });

  it('rejects a wrong password without signing in', async () => {
    userService.findCredentials.mockResolvedValue({
      id: 'uuid-1',
      username: 'Jane',
      email: credentials.email,
      password_hash: await hashPassword('another-password'),
    });

    await expect(service.login(credentials)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signInService.signIn).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    userService.findCredentials.mockResolvedValue(null);

    await expect(service.login(credentials)).rejects.toThrow('Invalid credentials');
    expect(signInService.signIn).not.toHaveBeenCalled();
  });
});
