import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('symptoms')
export class Symptom {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string
}