import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateHeadacheDto } from './dto/create-headache.dto.js';
import { HeadacheOptionsDto } from './dto/headache-options.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Headache } from './entities/headache.entity.js';
import { In, Repository } from 'typeorm';
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
    const { triggerIds, symptomIds, locationIds, reliefIds, notes, ...fields } = dto;
    const [locations, triggers, symptoms, reliefMeasures] = await Promise.all([
      this.findAllByIds(this.locationRepo, locationIds, 'location'),
      this.findAllByIds(this.triggerRepo, triggerIds, 'trigger'),
      this.findAllByIds(this.symptomRepo, symptomIds, 'symptom'),
      this.findAllByIds(this.reliefRepo, reliefIds, 'relief measure'),
    ]);

    const headache = this.headacheRepo.create({
      ...fields,
      notes: notes?.trim() || null,
      userId,
      locations,
      triggers,
      symptoms,
      reliefMeasures,
    })
    const saved = await this.headacheRepo.save(headache);
    // Return only the headache's own columns, not the userId or the lookup rows.
    return this.headacheRepo.findOneOrFail({ where: { id: saved.id }, select: { id: true, startedAt: true, endedAt: true, painLevel: true, notes: true } });
  }

  /** Loads the lookup rows for `ids`, throwing a 400 when any id does not exist. */
  private async findAllByIds<T extends { id: number }>(repo: Repository<T>, ids: number[], label: string): Promise<T[]> {
    if (ids.length === 0) return [];
    const rows = await repo.find({ where: { id: In(ids) } as never });
    if (rows.length !== ids.length) {
      const found = new Set(rows.map((r) => r.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new BadRequestException(`Unknown ${label} id(s): ${missing.join(', ')}`);
    }
    return rows;
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
