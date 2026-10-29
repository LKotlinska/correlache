import { MigrationInterface, QueryRunner } from "typeorm";

// Moves the exercise library schema from the Lyfta shape to the exercises-dataset shape.
// Every step is guarded because some databases already ran an edited version of
// ExerciseLibraryAndWorkouts that created the new shape directly.
export class ExercisesDatasetSchema1792832876000 implements MigrationInterface {
    name = 'ExercisesDatasetSchema1792832876000'

    private async hasColumn(queryRunner: QueryRunner, table: string, column: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column],
        );
        return rows.length > 0;
    }

    private async hasIndex(queryRunner: QueryRunner, table: string, index: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
            [table, index],
        );
        return rows.length > 0;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (!await this.hasColumn(queryRunner, 'exercises', 'gif_name')) {
            await queryRunner.query(`ALTER TABLE \`exercises\` ADD \`gif_name\` varchar(255) NULL`);
        }
        if (!await this.hasColumn(queryRunner, 'exercises', 'instructions')) {
            await queryRunner.query(`ALTER TABLE \`exercises\` ADD \`instructions\` json NULL`);
        }
        if (await this.hasColumn(queryRunner, 'exercises', 'exercise_type')) {
            await queryRunner.query(`ALTER TABLE \`exercises\` DROP COLUMN \`exercise_type\``);
        }

        if (await this.hasColumn(queryRunner, 'workout_exercises', 'lyfta_exercise_id')) {
            await queryRunner.query(`ALTER TABLE \`workout_exercises\` CHANGE \`lyfta_exercise_id\` \`exercise_id\` int NULL`);
        }
        if (await this.hasColumn(queryRunner, 'workout_exercises', 'superset_id')) {
            await queryRunner.query(`ALTER TABLE \`workout_exercises\` DROP COLUMN \`superset_id\``);
        }

        if (await this.hasColumn(queryRunner, 'sets', 'set_type')) {
            await queryRunner.query(`ALTER TABLE \`sets\` DROP COLUMN \`set_type\``);
        }

        if (await this.hasIndex(queryRunner, 'muscles', 'IDX_ebae6be9718efd3dce1f586ad9')) {
            await queryRunner.query(`ALTER TABLE \`muscles\` DROP INDEX \`IDX_ebae6be9718efd3dce1f586ad9\``);
        }
        if (await this.hasColumn(queryRunner, 'muscles', 'lyfta_id')) {
            await queryRunner.query(`ALTER TABLE \`muscles\` DROP COLUMN \`lyfta_id\``);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`muscles\` ADD \`lyfta_id\` int NULL`);
        await queryRunner.query(`UPDATE \`muscles\` SET \`lyfta_id\` = \`id\``);
        await queryRunner.query(`ALTER TABLE \`muscles\` MODIFY \`lyfta_id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`muscles\` ADD UNIQUE INDEX \`IDX_ebae6be9718efd3dce1f586ad9\` (\`lyfta_id\`)`);
        await queryRunner.query(`ALTER TABLE \`sets\` ADD \`set_type\` enum ('normal', 'warmup', 'dropset', 'failure') NOT NULL DEFAULT 'normal'`);
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` ADD \`superset_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` CHANGE \`exercise_id\` \`lyfta_exercise_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`exercises\` ADD \`exercise_type\` enum ('weight_reps', 'reps_only', 'duration', 'distance_duration', 'weight_duration') NOT NULL DEFAULT 'weight_reps'`);
        await queryRunner.query(`ALTER TABLE \`exercises\` DROP COLUMN \`instructions\``);
        await queryRunner.query(`ALTER TABLE \`exercises\` DROP COLUMN \`gif_name\``);
    }
}
