import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HeadacheService } from './headache.service.js';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { UpdateHeadacheDto } from './dto/update-headache.dto.js';

@Controller('headache')
export class HeadacheController {
  constructor(private readonly headacheService: HeadacheService) {}

  @Post()
  create(@Body() createHeadacheDto: CreateHeadacheDto) {
    return this.headacheService.create(createHeadacheDto);
  }

  @Get()
  findAll() {
    return this.headacheService.findAll();
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
