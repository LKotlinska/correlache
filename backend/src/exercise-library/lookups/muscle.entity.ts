import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MuscleGroup } from "./muscle-group.entity.js";

@Entity('muscles')
export class Muscle {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50 })
    name: string

    @ManyToOne(() => MuscleGroup, (group) => group.name, { nullable: false })
    @JoinColumn({ name: 'muscle_group_id' })
    muscleGroup: MuscleGroup
}