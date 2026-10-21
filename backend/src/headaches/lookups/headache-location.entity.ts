import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('locations')
export class HeadacheLocation {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string

    @Column("varchar", { length: 255, nullable: true})
    image: string | null
}