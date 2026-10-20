import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { User } from '../user/entities/user.entity.js';
import { HeadacheService } from './headache.service.js';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { UpdateHeadacheDto } from './dto/update-headache.dto.js';
import { HeadacheOptionsDto } from './dto/headache-options.dto.js';

@Controller('headaches')
export class HeadacheController {
  constructor(private readonly headacheService: HeadacheService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateHeadacheDto) {
    return this.headacheService.create(user.id, dto);
  }

  @Get()
  findAll() {
    return this.headacheService.findAll();
  }
  
  @Get('options')
  async getOptions(): Promise<HeadacheOptionsDto> {
    return await this.headacheService.getOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.headacheService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHeadacheDto: UpdateHeadacheDto) {
    return this.headacheService.update(+id, updateHeadacheDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.headacheService.remove(+id);
  }


}
