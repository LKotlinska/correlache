import { Injectable } from '@nestjs/common';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { UpdateHeadacheDto } from './dto/update-headache.dto.js'
import { HeadacheOptionsDto } from './dto/headache-options.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Headache } from './entities/headache.entity.js';
import { Repository } from 'typeorm';
import { Trigger } from './lookups/trigger.entity.js';
import { Symptom } from './lookups/symptom.entity.js';
import { ReliefMeasure } from './lookups/relief-measure.entity.js';
import { HeadacheLocation } from './lookups/headache-location.entity.js';

@Injectable()
export class HeadacheService {
  @InjectRepository(Headache)
  private readonly headacheRepo: Repository<Headache>

  @InjectRepository(Trigger)
  private readonly triggerRepo: Repository<Trigger>

  @InjectRepository(Symptom)
  private readonly symptomRepo: Repository<Symptom>

  @InjectRepository(ReliefMeasure)
  private readonly reliefRepo: Repository<ReliefMeasure>

  @InjectRepository(HeadacheLocation)
  private readonly locationRepo: Repository<HeadacheLocation>

  async create(userId: string, dto: CreateHeadacheDto): Promise<Headache> {
    const { triggerIds, symptomIds, locationIds, reliefIds, ...fields } = dto;
    const headache = this.headacheRepo.create({
      ...fields,
      userId,
      locations: locationIds.map((id) => ({ id })),
      triggers: triggerIds.map((id) => ({ id })),
      symptoms: symptomIds.map((id) => ({ id })),
      reliefMeasures: reliefIds.map((id) => ({ id })),
    })
    return this.headacheRepo.save(headache);
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

  async getOptions(): Promise<HeadacheOptionsDto>{
    const [triggers, symptoms, reliefMeasures, headacheLocations ] = await Promise.all([
      this.triggerRepo.find(),
      this.symptomRepo.find(),
      this.reliefRepo.find(),
      this.locationRepo.find(),
    ])
    return { triggers, symptoms, reliefMeasures, headacheLocations };
  }
}
