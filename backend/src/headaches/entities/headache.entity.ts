import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entities/user.entity.js";
import { Trigger } from "../lookups/trigger.entity.js";
import { Symptom } from "../lookups/symptom.entity.js";
import { ReliefMeasure } from "../lookups/relief-measure.entity.js";
import { HeadacheLocation } from "../lookups/headache-location.entity.js";
@Index(['userId', 'startedAt']) // Speeds up queries by user
@Entity('headaches')
export class Headache {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: 'user_id', type: 'varchar', length: 36 })
    userId: string;

    @ManyToOne(() => User, (user) => user.headaches, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;

    @Column({ name: 'started_at', type: 'datetime' })
    startedAt: Date;

    @Column({ name: 'ended_at', type: 'datetime', nullable: true })
    endedAt: Date | null;

    @Column({ name: 'pain_level', type: 'tinyint' })
    painLevel: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @ManyToMany(() => Trigger)
    @JoinTable({
        name: 'headache_triggers',
        joinColumn: {
            name: 'headache_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'trigger_id',
            referencedColumnName: 'id'
        },
    })
    triggers: Trigger[];

    @ManyToMany(() => Symptom)
    @JoinTable({
        name: 'headache_symptoms',
        joinColumn: {
            name: 'headache_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'symptom_id',
            referencedColumnName: 'id'
        },
    })
    symptoms: Symptom[];

    @ManyToMany(() => ReliefMeasure)
    @JoinTable({
        name: 'headache_relief',
        joinColumn: {
            name: 'headache_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'relief_measure_id',
            referencedColumnName: 'id'
        }
    })
    reliefMeasures: ReliefMeasure[];

    @ManyToMany(() => HeadacheLocation)
    @JoinTable({
        name: 'headache_locations',
        joinColumn: {
            name: 'headache_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'location_id',
            referencedColumnName: 'id'
        }
    })
    locations: HeadacheLocation[];
}
