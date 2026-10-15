import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity('muscle_groups')
export class MuscleGroup {
    @PrimaryColumn("int")
    id: number

    @Column("varchar", { length: 50 })
    name: string
}