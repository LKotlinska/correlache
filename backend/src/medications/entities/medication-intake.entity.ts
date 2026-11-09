import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { Headache } from '../../headaches/entities/headache.entity.js';
import { Medication } from './medication.entity.js';
import { INTAKE_EFFECTS, MAX_DOSE_LENGTH } from '../medication-kinds.js';
import type { IntakeEffect } from '../medication-kinds.js';

/** One dose of a medication. */
@Index(['userId', 'takenAt'])
@Entity('medication_intakes')
export class MedicationIntake {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, select: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ name: 'medication_id', type: 'varchar', length: 36 })
  medicationId: string;

  // Medications with doses are archived rather than deleted, so this only cascades when the user is deleted.
  @ManyToOne(() => Medication, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'medication_id' })
  medication: Relation<Medication>;

  @Column({ name: 'taken_at', type: 'datetime' })
  takenAt: Date;

  @Column({ type: 'varchar', length: MAX_DOSE_LENGTH, nullable: true })
  dose: string | null;

  @Column({ name: 'headache_id', type: 'varchar', length: 36, nullable: true })
  headacheId: string | null;

  // Deleting a headache keeps the dose, just unlinked.
  @ManyToOne(() => Headache, (headache) => headache.intakes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'headache_id' })
  headache: Relation<Headache> | null;

  @Column({ type: 'enum', enum: INTAKE_EFFECTS, nullable: true })
  effect: IntakeEffect | null;

  @Column({ name: 'effect_at', type: 'datetime', nullable: true })
  effectAt: Date | null;
}
