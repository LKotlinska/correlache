import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service.js';
import { User } from './user.entity.js';

describe('UserService', () => {
  let service: UserService;
  const repo = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const dto = { name: 'Jane', email: 'jane@example.com', password: 'supersecret' };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a user with a hashed password and returns no hash', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation((u) => u);
    repo.save.mockImplementation(async (u) => ({ id: 'uuid-1', ...u }));

    const result = await service.create(dto);

    const created = repo.create.mock.calls[0][0];
    expect(created.username).toBe('Jane');
    expect(created.password_hash).not.toBe(dto.password);
    expect(created.password_hash).toContain(':');
    expect(result).toEqual({ id: 'uuid-1', username: 'Jane', email: 'jane@example.com' });
  });

  it('throws ConflictException when the email already exists', async () => {
    repo.findOneBy.mockResolvedValue({ id: 'existing' });

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
