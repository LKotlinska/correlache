import { MigrationInterface, QueryRunner } from "typeorm";

// Records what is measured per exercise in a workout (weight and reps, reps only, time, time and distance).
// Existing rows were all entered as weight and reps, which is the column default.
export class AddTrackingMode1792919276000 implements MigrationInterface {
    name = 'AddTrackingMode1792919276000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` ADD \`tracking_mode\` varchar(20) NOT NULL DEFAULT 'weight_reps'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` DROP COLUMN \`tracking_mode\``);
    }
}
