import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('body_parts')
export class BodyPart {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: 50, unique: true })
    name: string
}
