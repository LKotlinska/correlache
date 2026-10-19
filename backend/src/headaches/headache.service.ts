import { Injectable } from '@nestjs/common';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { UpdateHeadacheDto } from './dto/update-headache.dto.js';

@Injectable()
export class HeadacheService {
  create(createHeadacheDto: CreateHeadacheDto) {
    return 'This action adds a new headache';
  }

  findAll() {
    return `This action returns all headache`;
  }

  findOne(id: number) {
    return `This action returns a #${id} headache`;
  }

  update(id: number, updateHeadacheDto: UpdateHeadacheDto) {
    return `This action updates a #${id} headache`;
  }

  remove(id: number) {
    return `This action removes a #${id} headache`;
  }

  getOptions(){

  }
}
