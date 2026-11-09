import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MedicationService } from './medication.service.js';
import { Medication } from './entities/medication.entity.js';
import { MedicationIntake } from './entities/medication-intake.entity.js';
import { Headache } from '../headaches/entities/headache.entity.js';

const MED = '00000000-0000-4000-8000-000000000001';
const active = { id: MED, name: 'Ibuprofen', use: 'as_needed', archivedAt: null as Date | null };
const archived = { ...active, archivedAt: new Date() };
const preventive = { ...active, name: 'Propranolol', use: 'preventive' };

describe('MedicationService', () => {
  let service: MedicationService;
  const medicationRepo = {
    find: vi.fn(async () => [active]),
    findOne: vi.fn(),
    findOneByOrFail: vi.fn(async (where) => where),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => ({ id: 'm1', ...x })),
    delete: vi.fn(async () => ({ affected: 1 })),
  };
  const intakeRepo = {
    exists: vi.fn(),
    find: vi.fn(async () => []),
    findOne: vi.fn(),
    create: vi.fn((x) => x),
    save: vi.fn(async (x) => x),
    delete: vi.fn(async () => ({ affected: 1 })),
  };
  const headacheRepo = { exists: vi.fn(async () => true) };
  const em = {
    getRepository: (target: unknown) => (target === Medication ? medicationRepo : intakeRepo),
  } as never;

  beforeEach(async () => {
    vi.clearAllMocks();
    medicationRepo.find.mockResolvedValue([active]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicationService,
        { provide: getRepositoryToken(Medication), useValue: medicationRepo },
        { provide: getRepositoryToken(MedicationIntake), useValue: intakeRepo },
        { provide: getRepositoryToken(Headache), useValue: headacheRepo },
      ],
    }).compile();
    service = module.get(MedicationService);
  });

  describe('removeMedication', () => {
    it('deletes a medication with no doses', async () => {
      medicationRepo.findOne.mockResolvedValue({ id: 'm1', archivedAt: null });
      intakeRepo.exists.mockResolvedValue(false);
      await service.removeMedication('u1', 'm1');
      expect(medicationRepo.delete).toHaveBeenCalledWith({ id: 'm1', userId: 'u1' });
    });

    it('archives a medication with doses so its history stays', async () => {
      medicationRepo.findOne.mockResolvedValue({ id: 'm1', archivedAt: null });
      intakeRepo.exists.mockResolvedValue(true);
      await service.removeMedication('u1', 'm1');
      expect(medicationRepo.delete).not.toHaveBeenCalled();
      expect(medicationRepo.save).toHaveBeenCalledWith(expect.objectContaining({ archivedAt: expect.any(Date) }));
    });

    it("404s for someone else's medication", async () => {
      medicationRepo.findOne.mockResolvedValue(null);
      await expect(service.removeMedication('u1', 'm1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createIntake', () => {
    const dto = { medicationId: MED, takenAt: '2026-01-01T10:00:00.000Z', dose: ' ', effect: null, effectAt: '2026-01-01T11:00:00.000Z' };

    it("rejects someone else's medication", async () => {
      medicationRepo.find.mockResolvedValueOnce([]);
      await expect(service.createIntake('u1', dto)).rejects.toThrow(BadRequestException);
      expect(intakeRepo.save).not.toHaveBeenCalled();
    });

    it("rejects linking to someone else's headache", async () => {
      headacheRepo.exists.mockResolvedValueOnce(false);
      await expect(service.createIntake('u1', { ...dto, headacheId: 'h-other' })).rejects.toThrow(BadRequestException);
      expect(intakeRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a new dose of a removed medication', async () => {
      medicationRepo.find.mockResolvedValueOnce([archived]);
      await expect(service.createIntake('u1', dto)).rejects.toThrow(BadRequestException);
      expect(intakeRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a relief rating or a headache link on a preventive', async () => {
      medicationRepo.find.mockResolvedValue([preventive]);
      await expect(service.createIntake('u1', { ...dto, effect: 'some' })).rejects.toThrow(BadRequestException);
      await expect(service.createIntake('u1', { ...dto, headacheId: 'h1' })).rejects.toThrow(BadRequestException);
      expect(intakeRepo.save).not.toHaveBeenCalled();
    });

    it('stores a blank dose as null and drops an effect time without a rating', async () => {
      intakeRepo.save.mockResolvedValueOnce({ id: 'i1' });
      intakeRepo.findOne.mockResolvedValueOnce({ id: 'i1' });
      await service.createIntake('u1', dto);
      expect(intakeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ dose: null, effect: null, effectAt: null, headacheId: null, userId: 'u1' }),
      );
    });
  });

  describe('updateIntake', () => {
    const dto = { medicationId: MED, takenAt: '2026-01-01T10:00:00.000Z' };

    it('still lets an old dose of a removed medication be edited', async () => {
      intakeRepo.findOne.mockResolvedValueOnce({ id: 'i1', medicationId: MED }).mockResolvedValueOnce({ id: 'i1' });
      medicationRepo.find.mockResolvedValueOnce([archived]);
      await service.updateIntake('u1', 'i1', dto);
      expect(intakeRepo.save).toHaveBeenCalled();
    });

    it('rejects switching a dose over to a removed medication', async () => {
      intakeRepo.findOne.mockResolvedValueOnce({ id: 'i1', medicationId: 'another' });
      medicationRepo.find.mockResolvedValueOnce([archived]);
      await expect(service.updateIntake('u1', 'i1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('syncHeadacheIntakes', () => {
    const takenAt = '2026-01-01T10:00:00.000Z';

    it('updates and adds doses, deleting only the ones removed in the form', async () => {
      intakeRepo.find.mockResolvedValueOnce([
        { id: 'keep', medicationId: MED },
        { id: 'drop', medicationId: MED },
        { id: 'linked-elsewhere', medicationId: MED },
      ] as never);
      await service.syncHeadacheIntakes(em, 'u1', 'h1', [
        { id: 'keep', medicationId: MED, takenAt, effect: 'full' },
        { medicationId: MED, takenAt },
      ], ['drop']);
      expect(intakeRepo.delete).toHaveBeenCalledTimes(1);
      expect(intakeRepo.delete).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1', headacheId: 'h1' }));
      const deleted = (intakeRepo.delete.mock.calls[0] as unknown as [{ id: { value: string[] } }])[0].id.value;
      expect(deleted).toEqual(['drop']);
      const saved = intakeRepo.save.mock.calls[0][0] as { id?: string; headacheId?: string; effect: string | null }[];
      expect(saved).toHaveLength(2);
      expect(saved[0]).toMatchObject({ id: 'keep', effect: 'full' });
      expect(saved[1]).toMatchObject({ headacheId: 'h1', userId: 'u1' });
    });

    it('rejects a dose id that belongs to another headache', async () => {
      intakeRepo.find.mockResolvedValueOnce([]);
      await expect(
        service.syncHeadacheIntakes(em, 'u1', 'h1', [{ id: 'elsewhere', medicationId: MED, takenAt }], []),
      ).rejects.toThrow(BadRequestException);
      await expect(service.syncHeadacheIntakes(em, 'u1', 'h1', [], ['elsewhere'])).rejects.toThrow(BadRequestException);
      expect(intakeRepo.save).not.toHaveBeenCalled();
    });

    it('rejects a preventive, as its doses are not linked to headaches', async () => {
      medicationRepo.find.mockResolvedValueOnce([preventive]);
      await expect(service.syncHeadacheIntakes(em, 'u1', 'h1', [{ medicationId: MED, takenAt }], [])).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
