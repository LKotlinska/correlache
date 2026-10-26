import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";
import { Workout } from "./workout.entity.js";
import { WorkoutSet } from "./set.entity.js";

@Entity('workout_exercises')
export class WorkoutExercise {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: 'workout_id', type: 'varchar', length: 36 })
    workoutId: string;

    @ManyToOne(() => Workout, (workout) => workout.exercises, {
        onDelete: 'CASCADE',
        nullable: false,
    })
    @JoinColumn({ name: 'workout_id' })
    workout: Relation<Workout>;

    // Id of the exercise in the exercise library. Kept as a plain column (not a foreign key)
    // so imported workouts survive even if the library entry is missing.
    @Column({ name: 'exercise_id', type: 'int', nullable: true })
    exerciseId: number | null;

    @Column({ name: 'exercise_name', type: 'varchar', length: 150 })
    exerciseName: string;

    @Column({ name: 'order', type: 'int' })
    order: number;

    @OneToMany(() => WorkoutSet, (set) => set.workoutExercise)
    sets: WorkoutSet[];
}
