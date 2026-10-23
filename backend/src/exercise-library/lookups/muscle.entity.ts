import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MuscleGroup } from "./muscle-group.entity.js";

@Entity('muscles')
export class Muscle {
    @PrimaryGeneratedColumn()
    id: number

    @Column("int", { unique: true })
    lyfta_id: number

    @Column("varchar", { length: 50, unique: true })
    name: string

    @ManyToOne(() => MuscleGroup, { nullable: false })
    @JoinColumn({ name: 'muscle_group_id' })
    muscleGroup: MuscleGroup
}
