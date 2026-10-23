import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { WorkoutExercise } from "./workout-exercise.entity.js";

export enum SetType {
    NORMAL = 'normal',
    WARMUP = 'warmup',
    DROPSET = 'dropset',
    FAILURE = 'failure',
}

// Named WorkoutSet to avoid clashing with the global JavaScript Set
@Entity('sets')
export class WorkoutSet {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: 'workout_exercise_id', type: 'varchar', length: 36 })
    workoutExerciseId: string;

    @ManyToOne(() => WorkoutExercise, (we) => we.sets, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'workout_exercise_id' })
    workoutExercise: Relation<WorkoutExercise>;

    @Column({ name: 'order', type: 'int' })
    order: number;

    @Column({ type: 'float', nullable: true })
    weight: number | null;

    @Column({ type: 'int', nullable: true })
    reps: number | null;

    @Column({ type: 'float', nullable: true })
    distance: number | null;

    @Column({ name: 'duration_seconds', type: 'int', nullable: true })
    durationSeconds: number | null;

    @Column({ name: 'set_type', type: 'enum', enum: SetType, default: SetType.NORMAL })
    setType: SetType;
}
