import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { User } from "../../user/entities/user.entity.js";
import { WorkoutExercise } from "./workout-exercise.entity.js";

@Index(['userId', 'startedAt']) // Speeds up queries by user
@Entity('workouts')
export class Workout {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: 'user_id', type: 'varchar', length: 36 })
    userId: string;

    @ManyToOne(() => User, (user) => user.workouts, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'user_id' })
    user: Relation<User>;

    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ name: 'started_at', type: 'datetime' })
    startedAt: Date;

    @Column({ name: 'duration_seconds', type: 'int' })
    durationSeconds: number;

    @OneToMany(() => WorkoutExercise, (we) => we.workout)
    exercises: WorkoutExercise[];
}
