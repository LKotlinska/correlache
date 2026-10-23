import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('equipment')
export class Equipment {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string
}
