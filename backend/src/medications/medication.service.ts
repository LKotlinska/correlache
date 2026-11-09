import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { Medication } from './entities/medication.entity.js';
import { MedicationIntake } from './entities/medication-intake.entity.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { CreateMedicationDto } from './dto/create-medication.dto.js';
import { CreateIntakeDto, HeadacheIntakeDto, IntakeFieldsDto } from './dto/create-intake.dto.js';
import { takenWithin } from '../common/date-range.js';

@Injectable()
export class MedicationService {
  @InjectRepository(Medication)
  private readonly medicationRepo: Repository<Medication>;

  @InjectRepository(MedicationIntake)
  private readonly intakeRepo: Repository<MedicationIntake>;

  @InjectRepository(Headache)
  private readonly headacheRepo: Repository<Headache>;

  // Medications

  /** The user's medications by name; archived ones only when asked, e.g. to show them on old doses. */
  getMedications(userId: string, includeArchived = false): Promise<Medication[]> {
    return this.medicationRepo.find({
      where: { userId, ...(includeArchived ? {} : { archivedAt: IsNull() }) },
      order: { name: 'ASC' },
    });
  }

  async createMedication(userId: string, dto: CreateMedicationDto): Promise<Medication> {
    const saved = await this.medicationRepo.save(this.medicationRepo.create({ ...this.medicationFields(dto), userId }));
    return this.medicationRepo.findOneByOrFail({ id: saved.id });
  }

  async updateMedication(userId: string, id: string, dto: CreateMedicationDto): Promise<Medication> {
    const medication = await this.findOwnMedication(userId, id);
    Object.assign(medication, this.medicationFields(dto));
    await this.medicationRepo.save(medication);
    return this.medicationRepo.findOneByOrFail({ id });
  }

  /** Deletes a medication with no doses; one with doses is archived instead so its history stays intact. */
  async removeMedication(userId: string, id: string): Promise<void> {
    const medication = await this.findOwnMedication(userId, id);
    const used = await this.intakeRepo.exists({ where: { medicationId: id } });
    if (used) {
      medication.archivedAt ??= new Date();
      await this.medicationRepo.save(medication);
    } else {
      await this.medicationRepo.delete({ id, userId });
    }
  }

  private medicationFields(dto: CreateMedicationDto) {
    return {
      name: dto.name.trim(),
      medicationClass: dto.medicationClass,
      use: dto.use,
      defaultDose: dto.defaultDose?.trim() || null,
    };
  }

  private async findOwnMedication(userId: string, id: string): Promise<Medication> {
    const medication = await this.medicationRepo.findOne({ where: { id, userId } });
    if (!medication) throw new NotFoundException(`Medication ${id} not found`);
    return medication;
  }

  // Doses

  /** The user's doses, newest first, optionally limited to those taken from `from` (inclusive) until `to` (exclusive), and to at most `limit`. */
  getIntakes(userId: string, from?: Date, to?: Date, limit?: number): Promise<MedicationIntake[]> {
    return this.intakeRepo.find({
      where: { userId, ...takenWithin(from, to) },
      relations: { medication: true },
      order: { takenAt: 'DESC' },
      take: limit,
    });
  }

  async getIntakeById(userId: string, id: string): Promise<MedicationIntake> {
    const intake = await this.intakeRepo.findOne({
      where: { id, userId },
      relations: { medication: true },
    });
    if (!intake) throw new NotFoundException(`Dose ${id} not found`);
    return intake;
  }

  async createIntake(userId: string, dto: CreateIntakeDto): Promise<MedicationIntake> {
    await this.assertOwnMedications(this.medicationRepo, userId, [dto.medicationId]);
    await this.assertOwnHeadache(userId, dto.headacheId);
    const saved = await this.intakeRepo.save(
      this.intakeRepo.create({ ...this.intakeFields(dto), headacheId: dto.headacheId ?? null, userId }),
    );
    return this.getIntakeById(userId, saved.id);
  }

  /** Replaces all of a dose's fields with `dto`, throwing a 404 if it isn't the user's. */
  async updateIntake(userId: string, id: string, dto: CreateIntakeDto): Promise<MedicationIntake> {
    const intake = await this.intakeRepo.findOne({ where: { id, userId } });
    if (!intake) throw new NotFoundException(`Dose ${id} not found`);
    await this.assertOwnMedications(this.medicationRepo, userId, [dto.medicationId]);
    await this.assertOwnHeadache(userId, dto.headacheId);
    Object.assign(intake, { ...this.intakeFields(dto), headacheId: dto.headacheId ?? null });
    await this.intakeRepo.save(intake);
    return this.getIntakeById(userId, id);
  }

  async removeIntake(userId: string, id: string): Promise<void> {
    const { affected } = await this.intakeRepo.delete({ id, userId });
    if (!affected) throw new NotFoundException(`Dose ${id} not found`);
  }

  /**
   * Makes the headache's doses match `intakes`, inside the headache's transaction:
   * doses with an `id` are updated, those without are added, and linked doses left out are deleted.
   */
  async syncHeadacheIntakes(em: EntityManager, userId: string, headacheId: string, intakes: HeadacheIntakeDto[]): Promise<void> {
    const intakeRepo = em.getRepository(MedicationIntake);
    await this.assertOwnMedications(em.getRepository(Medication), userId, intakes.map((i) => i.medicationId));

    const existing = await intakeRepo.find({ where: { userId, headacheId } });
    const existingById = new Map(existing.map((i) => [i.id, i]));
    const unknown = intakes.filter((i) => i.id && !existingById.has(i.id));
    if (unknown.length) {
      throw new BadRequestException(`Unknown dose id(s) for this headache: ${unknown.map((i) => i.id).join(', ')}`);
    }

    const keptIds = new Set(intakes.map((i) => i.id).filter(Boolean));
    const removed = existing.filter((i) => !keptIds.has(i.id)).map((i) => i.id);
    if (removed.length) await intakeRepo.delete({ id: In(removed), userId });

    const rows = intakes.map((dto) =>
      dto.id
        ? Object.assign(existingById.get(dto.id)!, this.intakeFields(dto))
        : intakeRepo.create({ ...this.intakeFields(dto), headacheId, userId }),
    );
    if (rows.length) await intakeRepo.save(rows);
  }

  private intakeFields(dto: IntakeFieldsDto) {
    const effect = dto.effect ?? null;
    return {
      medicationId: dto.medicationId,
      takenAt: new Date(dto.takenAt),
      dose: dto.dose?.trim() || null,
      effect,
      // A time without a rating means nothing, so it goes with the rating
      effectAt: effect && dto.effectAt ? new Date(dto.effectAt) : null,
    };
  }

  /** Throws a 400 unless every id is one of the user's medications (archived ones included, for editing old doses). */
  private async assertOwnMedications(repo: Repository<Medication>, userId: string, ids: string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;
    const found = await repo.count({ where: { id: In(unique), userId } });
    if (found !== unique.length) throw new BadRequestException('Unknown medication');
  }

  private async assertOwnHeadache(userId: string, headacheId?: string | null): Promise<void> {
    if (!headacheId) return;
    const exists = await this.headacheRepo.exists({ where: { id: headacheId, userId } });
    if (!exists) throw new BadRequestException('Unknown headache');
  }
}
