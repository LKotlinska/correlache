import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { MAX_DOSE_LENGTH, MAX_NAME_LENGTH, MEDICATION_CLASSES, MEDICATION_USES } from '../medication-kinds.js';
import type { MedicationClass, MedicationUse } from '../medication-kinds.js';

/** A medication on the user's own list, managed in settings. */
@Index(['userId'])
@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36, select: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User>;

  @Column({ type: 'varchar', length: MAX_NAME_LENGTH })
  name: string;

  @Column({ name: 'class', type: 'enum', enum: MEDICATION_CLASSES })
  medicationClass: MedicationClass;

  @Column({ name: 'default_dose', type: 'varchar', length: MAX_DOSE_LENGTH, nullable: true })
  defaultDose: string | null;

  @Column({ type: 'enum', enum: MEDICATION_USES, default: 'as_needed' })
  use: MedicationUse;

  /** Set instead of deleting when doses were logged, so the history (and overuse counts) keep their medication. */
  @Column({ name: 'archived_at', type: 'datetime', nullable: true })
  archivedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;
}
