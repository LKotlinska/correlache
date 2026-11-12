import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { Headache } from '../headaches/entities/headache.entity.js';
import { Medication } from '../medications/entities/medication.entity.js';
import { MedicationIntake } from '../medications/entities/medication-intake.entity.js';
import { Workout } from '../exercise-library/entities/workout.entity.js';

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
const names = (items: { name: string }[]) => items.map((i) => i.name).sort();

/**
 * Builds a copy of everything stored about one user (GDPR art. 15 access, art. 20 portability).
 * Lookups are written as names, not ids, so the file makes sense on its own.
 * The password hash and token version are left out: they are security data, not the user's records.
 */
@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Headache) private readonly headacheRepo: Repository<Headache>,
    @InjectRepository(Medication) private readonly medicationRepo: Repository<Medication>,
    @InjectRepository(MedicationIntake) private readonly intakeRepo: Repository<MedicationIntake>,
    @InjectRepository(Workout) private readonly workoutRepo: Repository<Workout>,
  ) {}

  async exportUser(userId: string) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException();

    const [headaches, medications, intakes, workouts] = await Promise.all([
      this.headacheRepo.find({
        where: { userId },
        relations: { triggers: true, symptoms: true, locations: true, reliefMeasures: true },
        order: { startedAt: 'ASC' },
      }),
      this.medicationRepo.find({
        where: { userId },
        // createdAt is not selected by default
        select: { id: true, name: true, medicationClass: true, defaultDose: true, use: true, archivedAt: true, createdAt: true },
        order: { createdAt: 'ASC' },
      }),
      this.intakeRepo.find({
        where: { userId },
        relations: { medication: true },
        order: { takenAt: 'ASC' },
      }),
      this.workoutRepo.find({
        where: { userId },
        relations: { exercises: { sets: true } },
        order: { startedAt: 'ASC' },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      account: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
        healthDataConsentAt: user.health_data_consent_at,
      },
      headaches: headaches.map((h) => ({
        id: h.id,
        startedAt: h.startedAt,
        endedAt: h.endedAt,
        painLevel: h.painLevel,
        notes: h.notes,
        locations: names(h.locations),
        symptoms: names(h.symptoms),
        triggers: names(h.triggers),
        reliefMeasures: names(h.reliefMeasures),
      })),
      medications: medications.map((m) => ({
        id: m.id,
        name: m.name,
        class: m.medicationClass,
        defaultDose: m.defaultDose,
        use: m.use,
        createdAt: m.createdAt,
        archivedAt: m.archivedAt,
      })),
      medicationIntakes: intakes.map((i) => ({
        id: i.id,
        takenAt: i.takenAt,
        medicationId: i.medicationId,
        medication: i.medication.name,
        dose: i.dose,
        headacheId: i.headacheId,
        effect: i.effect,
        effectAt: i.effectAt,
      })),
      workouts: workouts.map((w) => ({
        id: w.id,
        title: w.title,
        startedAt: w.startedAt,
        durationSeconds: w.durationSeconds,
        exercises: [...w.exercises].sort(byOrder).map((e) => ({
          // Id in the app's exercise library; null when the exercise wasn't found there
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          trackingMode: e.trackingMode,
          sets: [...e.sets].sort(byOrder).map((s) => ({
            weight: s.weight,
            reps: s.reps,
            distance: s.distance,
            durationSeconds: s.durationSeconds,
          })),
        })),
      })),
    };
  }
}
