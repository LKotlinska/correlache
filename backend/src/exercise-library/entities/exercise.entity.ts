import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Equipment } from "../lookups/equipment.entity.js";
import { BodyPart } from "../lookups/body-part.entity.js";
import { ExerciseMuscle } from "./exercise-muscle.entity.js";

@Entity('exercises')
export class Exercise {
    // Same id as the exercises-dataset library, so it is not auto-generated
    @PrimaryColumn("int")
    id: number;

    @Column("varchar", { length: 150 })
    name: string;

    @Column({ name: 'image_name', type: 'varchar', length: 255, nullable: true })
    imageName: string | null;

    @Column({ name: 'gif_name', type: 'varchar', length: 255, nullable: true })
    gifName: string | null;

    // English step-by-step instructions, e.g. ['Lie flat...', ...].
    // Not selected by default so listing exercises stays light; select it explicitly when needed.
    @Column({ type: 'json', nullable: true, select: false })
    instructions: string[] | null;

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

    @OneToMany(() => ExerciseMuscle, (em) => em.exercise)
    muscles: ExerciseMuscle[];
}
