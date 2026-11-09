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
    const medications = await this.findOwnMedications(this.medicationRepo, userId, [dto.medicationId]);
    this.assertDoseAllowed(medications.get(dto.medicationId)!, dto, !!dto.headacheId);
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
    const medications = await this.findOwnMedications(this.medicationRepo, userId, [dto.medicationId]);
    this.assertDoseAllowed(medications.get(dto.medicationId)!, dto, !!dto.headacheId, intake.medicationId);
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
   * Applies the headache form's dose changes inside the headache's transaction: doses with an `id` are updated,
   * those without are added, and those in `removedIds` are deleted. Other doses of the headache are left alone.
   */
  async syncHeadacheIntakes(
    em: EntityManager,
    userId: string,
    headacheId: string,
    intakes: HeadacheIntakeDto[],
    removedIds: string[],
  ): Promise<void> {
    const intakeRepo = em.getRepository(MedicationIntake);
    const medications = await this.findOwnMedications(em.getRepository(Medication), userId, intakes.map((i) => i.medicationId));

    const existing = await intakeRepo.find({ where: { userId, headacheId } });
    const existingById = new Map(existing.map((i) => [i.id, i]));
    const unknown = [...intakes.map((i) => i.id), ...removedIds].filter((id) => id && !existingById.has(id));
    if (unknown.length) {
      throw new BadRequestException(`Unknown dose id(s) for this headache: ${unknown.join(', ')}`);
    }

    for (const dto of intakes) {
      const previous = dto.id ? existingById.get(dto.id)!.medicationId : undefined;
      this.assertDoseAllowed(medications.get(dto.medicationId)!, dto, true, previous);
    }

    if (removedIds.length) await intakeRepo.delete({ id: In(removedIds), userId, headacheId });

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

  /**
   * Throws a 400 when the dose isn't allowed for its medication:
   * - a removed (archived) medication only keeps the doses it already has, so `previousMedicationId` must be it;
   * - a preventive is taken regularly rather than for a headache, so its doses aren't rated or linked.
   */
  private assertDoseAllowed(medication: Medication, dto: IntakeFieldsDto, linked: boolean, previousMedicationId?: string): void {
    if (medication.archivedAt && medication.id !== previousMedicationId) {
      throw new BadRequestException(`${medication.name} was removed from your medications`);
    }
    if (medication.use === 'preventive') {
      if (dto.effect != null) throw new BadRequestException("Doses of a preventive aren't rated for relief");
      if (linked) throw new BadRequestException("Doses of a preventive can't be linked to a headache");
    }
  }

  /** The user's medications with these ids (archived ones included), throwing a 400 when any isn't theirs. */
  private async findOwnMedications(repo: Repository<Medication>, userId: string, ids: string[]): Promise<Map<string, Medication>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const found = await repo.find({ where: { id: In(unique), userId } });
    if (found.length !== unique.length) throw new BadRequestException('Unknown medication');
    return new Map(found.map((m) => [m.id, m]));
  }

  private async assertOwnHeadache(userId: string, headacheId?: string | null): Promise<void> {
    if (!headacheId) return;
    const exists = await this.headacheRepo.exists({ where: { id: headacheId, userId } });
    if (!exists) throw new BadRequestException('Unknown headache');
  }
}
