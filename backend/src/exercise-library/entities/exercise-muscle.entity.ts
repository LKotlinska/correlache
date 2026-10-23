import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Exercise } from "./exercise.entity.js";
import { Muscle } from "../lookups/muscle.entity.js";

export enum MuscleRole {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
}

@Entity('exercise_muscles')
export class ExerciseMuscle {
    @PrimaryColumn({ name: 'exercise_id', type: 'int' })
    exerciseId: number;

    @PrimaryColumn({ name: 'muscle_id', type: 'int' })
    muscleId: number;

    @ManyToOne(() => Exercise, (exercise) => exercise.muscles, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'exercise_id' })
    exercise: Relation<Exercise>;

    @ManyToOne(() => Muscle, { nullable: false })
    @JoinColumn({ name: 'muscle_id' })
    muscle: Relation<Muscle>;

    @Column({ type: 'enum', enum: MuscleRole })
    role: MuscleRole;
}
