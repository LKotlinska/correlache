import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/user.dto.js';
import { hashPassword } from '../common/password.js';

const emailTaken = () =>
  new ConflictException({
    statusCode: 409,
    code: 'EMAIL_TAKEN',
    field: 'email',
    message: 'Email already registered',
  });

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const email = normalize(dto.email);
    const existing = await this.findByEmail(email);
    if (existing) {
        throw emailTaken();
    }

    const user = this.userRepository.create({
        username: dto.name,
        email,
        password_hash: await hashPassword(dto.password),
    });

    let saved: User;
    try {
        saved = await this.userRepository.save(user);
    } catch (err) {
        // Two concurrent signups can both pass the check above; the unique constraint catches the second.
        if (err instanceof QueryFailedError && (err as { code?: string }).code === 'ER_DUP_ENTRY') {
            throw emailTaken();
        }
        throw err;
    }

    return { id: saved.id, username: saved.username, email: saved.email }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({
        email: email.trim().toLowerCase(),
    })
  }
  
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({
        id
    })
  }

  async findCredentials(email: string): Promise<Omit<User, 'created_at'> | null> {
    let user = await this.userRepository
        .createQueryBuilder('user')
        .addSelect('user.password_hash')
        .where('user.email = :email', { email: normalize(email) })
        .getOne();
    return user ? { id: user.id, username: user.username, email: user.email, password_hash: user.password_hash} : null
  }
}

const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();