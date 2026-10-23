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

    // Id of the exercise in the Lyfta library. Kept as a plain column (not a foreign key)
    // so imported workouts survive even if the library entry is missing.
    @Column({ name: 'lyfta_exercise_id', type: 'int', nullable: true })
    lyftaExerciseId: number | null;

    @Column({ name: 'exercise_name', type: 'varchar', length: 150 })
    exerciseName: string;

    @Column({ name: 'order', type: 'int' })
    order: number;

    // Exercises sharing the same superset id are performed as a superset
    @Column({ name: 'superset_id', type: 'int', nullable: true })
    supersetId: number | null;

    @OneToMany(() => WorkoutSet, (set) => set.workoutExercise)
    sets: WorkoutSet[];
}
