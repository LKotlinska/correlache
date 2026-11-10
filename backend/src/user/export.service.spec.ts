import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExportService } from './export.service.js';
import { User } from './entities/user.entity.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { Medication } from '../medications/entities/medication.entity.js';
import { MedicationIntake } from '../medications/entities/medication-intake.entity.js';
import { Workout } from '../exercise-library/entities/workout.entity.js';

describe('ExportService', () => {
  let service: ExportService;
  const userRepo = { findOneBy: vi.fn() };
  const headacheRepo = { find: vi.fn() };
  const medicationRepo = { find: vi.fn() };
  const intakeRepo = { find: vi.fn() };
  const workoutRepo = { find: vi.fn() };

  const user = {
    id: 'uuid-1',
    username: 'Jane',
    email: 'jane@example.com',
    password_hash: 'salt:hash',
    tokenVersion: 3,
    health_data_consent_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Headache), useValue: headacheRepo },
        { provide: getRepositoryToken(Medication), useValue: medicationRepo },
        { provide: getRepositoryToken(MedicationIntake), useValue: intakeRepo },
        { provide: getRepositoryToken(Workout), useValue: workoutRepo },
      ],
    }).compile();
    service = module.get(ExportService);

    userRepo.findOneBy.mockResolvedValue(user);
    headacheRepo.find.mockResolvedValue([
      {
        id: 'h1', startedAt: new Date('2026-02-01'), endedAt: null, painLevel: 6, notes: 'bad one',
        triggers: [{ id: 2, name: 'Stress' }, { id: 1, name: 'Alcohol' }],
        symptoms: [{ id: 1, name: 'Nausea' }], locations: [{ id: 1, name: 'Temples' }], reliefMeasures: [],
      },
    ]);
    medicationRepo.find.mockResolvedValue([
      { id: 'm1', name: 'Ibuprofen', medicationClass: 'nsaid', defaultDose: '400 mg', use: 'as_needed', archivedAt: null, createdAt: new Date() },
    ]);
    intakeRepo.find.mockResolvedValue([
      { id: 'i1', takenAt: new Date(), medicationId: 'm1', medication: { name: 'Ibuprofen' }, dose: '400 mg', headacheId: 'h1', effect: null, effectAt: null },
    ]);
    workoutRepo.find.mockResolvedValue([
      {
        id: 'w1', title: 'Legs', startedAt: new Date(), durationSeconds: 3600,
        exercises: [
          { order: 1, exerciseName: 'Lunge', trackingMode: 'weight_reps', sets: [] },
          { order: 0, exerciseName: 'Squat', trackingMode: 'weight_reps', sets: [
            { order: 1, weight: 60, reps: 8, distance: null, durationSeconds: null },
            { order: 0, weight: 50, reps: 10, distance: null, durationSeconds: null },
          ] },
        ],
      },
    ]);
  });

  it('queries every table for the requested user only', async () => {
    await service.exportUser('uuid-1');

    expect(userRepo.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
    for (const repo of [headacheRepo, medicationRepo, intakeRepo, workoutRepo]) {
      expect(repo.find.mock.calls[0][0].where).toEqual({ userId: 'uuid-1' });
    }
  });

  it('leaves out the password hash and token version', async () => {
    const result = await service.exportUser('uuid-1');

    const json = JSON.stringify(result);
    expect(json).not.toContain('password');
    expect(json).not.toContain('salt:hash');
    expect(json).not.toContain('tokenVersion');
    expect(result.account).toEqual({
      id: 'uuid-1', username: 'Jane', email: 'jane@example.com',
      createdAt: user.created_at, healthDataConsentAt: user.health_data_consent_at,
    });
  });

  it('writes lookups as names and keeps exercises and sets in order', async () => {
    const result = await service.exportUser('uuid-1');

    expect(result.headaches[0].triggers).toEqual(['Alcohol', 'Stress']);
    expect(result.medicationIntakes[0].medication).toBe('Ibuprofen');
    const [squat, lunge] = result.workouts[0].exercises;
    expect([squat.exerciseName, lunge.exerciseName]).toEqual(['Squat', 'Lunge']);
    expect(squat.sets.map((s) => s.weight)).toEqual([50, 60]);
  });

  it('throws when the user no longer exists', async () => {
    userRepo.findOneBy.mockResolvedValue(null);
    await expect(service.exportUser('gone')).rejects.toBeInstanceOf(NotFoundException);
  });
});
