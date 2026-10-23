import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Equipment } from "../lookups/equipment.entity.js";
import { BodyPart } from "../lookups/body-part.entity.js";
import { ExerciseMuscle } from "./exercise-muscle.entity.js";

export enum ExerciseType {
    WEIGHT_REPS = 'weight_reps',
    REPS_ONLY = 'reps_only',
    DURATION = 'duration',
    DISTANCE_DURATION = 'distance_duration',
    WEIGHT_DURATION = 'weight_duration',
}

@Entity('exercises')
export class Exercise {
    // Same id as the Lyfta exercise library, so it is not auto-generated
    @PrimaryColumn("int")
    id: number;

    @Column("varchar", { length: 150 })
    name: string;

    @Column({ name: 'image_name', type: 'varchar', length: 255, nullable: true })
    imageName: string | null;

    @Column({ name: 'equipment_id', type: 'int' })
    equipmentId: number;

    @ManyToOne(() => Equipment, { nullable: false })
    @JoinColumn({ name: 'equipment_id' })
    equipment: Relation<Equipment>;

    @Column({ name: 'body_part_id', type: 'int' })
    bodyPartId: number;

    @ManyToOne(() => BodyPart, { nullable: false })
    @JoinColumn({ name: 'body_part_id' })
    bodyPart: Relation<BodyPart>;

    @Column({ name: 'exercise_type', type: 'enum', enum: ExerciseType })
    exerciseType: ExerciseType;

    @OneToMany(() => ExerciseMuscle, (em) => em.exercise)
    muscles: ExerciseMuscle[];
}
