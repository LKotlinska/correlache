import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Headache } from "../../headaches/entities/headache.entity.js";
import { Workout } from "../../exercise-library/entities/workout.entity.js";

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

    @Column({ type: 'int', default: 0 })
    tokenVersion: number
    
    @OneToMany(() => Headache, (headache) => headache.user)
    headaches: Headache[]

    @OneToMany(() => Workout, (workout) => workout.user)
    workouts: Workout[]

    @CreateDateColumn()
    created_at: Date
}