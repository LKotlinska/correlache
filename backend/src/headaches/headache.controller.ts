import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { User } from '../user/entities/user.entity.js';
import { HeadacheService } from './headache.service.js';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { HeadacheOptionsDto } from './dto/headache-options.dto.js';
import { Headache } from './entities/headache.entity.js';

@Controller('headaches')
export class HeadacheController {
  constructor(private readonly headacheService: HeadacheService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateHeadacheDto) {
    return this.headacheService.create(user.id, dto);
  }

  @Get('options')
  async getOptions(): Promise<HeadacheOptionsDto> {
    return await this.headacheService.getOptions();
  }

  @Get('')
  async getHeadaches(@CurrentUser() user: User): Promise<Headache[]> {
    return await this.headacheService.getHeadaches(user.id);
  }

  @Get(':id')
  async getHeadacheById(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<Headache> {
    return await this.headacheService.getHeadacheById(user.id, id);
  }
}
