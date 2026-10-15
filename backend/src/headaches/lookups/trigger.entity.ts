import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('triggers')
export class Trigger {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string
}