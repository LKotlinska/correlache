import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('relief_measures')
export class ReliefMeasure {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string
}