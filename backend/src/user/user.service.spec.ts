import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { UserService } from './user.service.js';
import { User } from './user.entity.js';

describe('UserService', () => {
  let service: UserService;
  const repo = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
    createQueryBuilder: vi.fn(),
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

  it('flags the conflict with a code and field the client can map to the email input', async () => {
    repo.findOneBy.mockResolvedValue({ id: 'existing' });

    const error = await service.create(dto).catch((e) => e);

    expect(error.getResponse()).toMatchObject({ code: 'EMAIL_TAKEN', field: 'email' });
  });

  it('trims and lowercases the email before lookup and save', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation((u) => u);
    repo.save.mockImplementation(async (u) => ({ id: 'uuid-1', ...u }));

    const result = await service.create({ ...dto, email: '  Jane@Example.COM ' });

    expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'jane@example.com' });
    expect(repo.create.mock.calls[0][0].email).toBe('jane@example.com');
    expect(result.email).toBe('jane@example.com');
  });

  it('maps a duplicate-key error from save to ConflictException', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation((u) => u);
    const dupError = Object.assign(new QueryFailedError('INSERT', [], new Error('dup')), {
      code: 'ER_DUP_ENTRY',
    });
    repo.save.mockRejectedValue(dupError);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rethrows other save errors unchanged', async () => {
    repo.findOneBy.mockResolvedValue(null);
    repo.create.mockImplementation((u) => u);
    const boom = new Error('connection lost');
    repo.save.mockRejectedValue(boom);

    await expect(service.create(dto)).rejects.toBe(boom);
  });

  it('findByEmail normalizes the email before lookup', async () => {
    repo.findOneBy.mockResolvedValue(null);

    await service.findByEmail('  Jane@Example.COM ');

    expect(repo.findOneBy).toHaveBeenCalledWith({ email: 'jane@example.com' });
  });

  it('findCredentials selects the hash and looks up the normalized email', async () => {
    const user = { id: 'uuid-1', password_hash: 'salt:hash' };
    const qb = {
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      getOne: vi.fn().mockResolvedValue(user),
    };
    repo.createQueryBuilder.mockReturnValue(qb);

    await expect(service.findCredentials('  Jane@Example.COM ')).resolves.toBe(user);
    expect(qb.addSelect).toHaveBeenCalledWith('user.password_hash');
    expect(qb.where).toHaveBeenCalledWith('user.email = :email', { email: 'jane@example.com' });
  });
});
