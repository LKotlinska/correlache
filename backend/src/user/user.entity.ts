import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: 50 })
    username: string

    @Column("varchar", { length: 255, unique: true })
    email: string

    @Column("varchar", { length: 255, select: false })
    password_hash: string

    @CreateDateColumn()
    created_at: Date
}