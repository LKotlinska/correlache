import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { hashPassword } from '../common/password.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOneBy({ email });
    if (existing) {
        throw new ConflictException('Email already registered');
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
            throw new ConflictException('Email already registered');
        }
        throw err;
    }

    return { id: saved.id, username: saved.username, email: saved.email }
  }

}
