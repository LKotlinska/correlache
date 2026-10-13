import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { doesNotThrow } from 'assert';
import { hashPassword } from '../common/password.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userRepository.findOneBy({ email: dto.email})
    if (existing) {
        throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
        username: dto.name,
        email: dto.email,
        password_hash: await hashPassword(dto.password),
    });

    const saved = await this.userRepository.save(user);

    return { id: saved.id, username: saved.username, email: saved.email }
  }

}
