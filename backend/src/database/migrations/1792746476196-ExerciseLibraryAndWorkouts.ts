import { MigrationInterface, QueryRunner } from "typeorm";

export class ExerciseLibraryAndWorkouts1792746476196 implements MigrationInterface {
    name = 'ExerciseLibraryAndWorkouts1792746476196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`equipment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_b44a87bec78c8cf13f5bb83857\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`body_parts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_f98ca1ef4c161f1ada41ed0e9e\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`exercises\` (\`id\` int NOT NULL, \`name\` varchar(150) NOT NULL, \`image_name\` varchar(255) NULL, \`gif_name\` varchar(255) NULL, \`instructions\` json NULL, \`equipment_id\` int NOT NULL, \`body_part_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`exercise_muscles\` (\`exercise_id\` int NOT NULL, \`muscle_id\` int NOT NULL, \`role\` enum ('primary', 'secondary') NOT NULL, PRIMARY KEY (\`exercise_id\`, \`muscle_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`workouts\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`title\` varchar(150) NOT NULL, \`started_at\` datetime NOT NULL, \`duration_seconds\` int NOT NULL, INDEX \`IDX_4d5de268a0428738521d07bf29\` (\`user_id\`, \`started_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`workout_exercises\` (\`id\` varchar(36) NOT NULL, \`workout_id\` varchar(36) NOT NULL, \`exercise_id\` int NULL, \`exercise_name\` varchar(150) NOT NULL, \`order\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sets\` (\`id\` varchar(36) NOT NULL, \`workout_exercise_id\` varchar(36) NOT NULL, \`order\` int NOT NULL, \`weight\` float NULL, \`reps\` int NULL, \`distance\` float NULL, \`duration_seconds\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`exercises\` ADD CONSTRAINT \`FK_2bb208f4a02f1b077c67352fc11\` FOREIGN KEY (\`equipment_id\`) REFERENCES \`equipment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`exercises\` ADD CONSTRAINT \`FK_026442a164303ee80d7ee175dfe\` FOREIGN KEY (\`body_part_id\`) REFERENCES \`body_parts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`exercise_muscles\` ADD CONSTRAINT \`FK_a9a7890a7e3cb424d69248c9058\` FOREIGN KEY (\`exercise_id\`) REFERENCES \`exercises\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`exercise_muscles\` ADD CONSTRAINT \`FK_550db94c232e07a1b90111d5e29\` FOREIGN KEY (\`muscle_id\`) REFERENCES \`muscles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`workouts\` ADD CONSTRAINT \`FK_2df679279a7ac263bcff20c78dd\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` ADD CONSTRAINT \`FK_7e6040e931b008308aaddbb7d32\` FOREIGN KEY (\`workout_id\`) REFERENCES \`workouts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`sets\` ADD CONSTRAINT \`FK_31a6f55b3ecb4516de1970f5c94\` FOREIGN KEY (\`workout_exercise_id\`) REFERENCES \`workout_exercises\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`sets\` DROP FOREIGN KEY \`FK_31a6f55b3ecb4516de1970f5c94\``);
        await queryRunner.query(`ALTER TABLE \`workout_exercises\` DROP FOREIGN KEY \`FK_7e6040e931b008308aaddbb7d32\``);
        await queryRunner.query(`ALTER TABLE \`workouts\` DROP FOREIGN KEY \`FK_2df679279a7ac263bcff20c78dd\``);
        await queryRunner.query(`ALTER TABLE \`exercise_muscles\` DROP FOREIGN KEY \`FK_550db94c232e07a1b90111d5e29\``);
        await queryRunner.query(`ALTER TABLE \`exercise_muscles\` DROP FOREIGN KEY \`FK_a9a7890a7e3cb424d69248c9058\``);
        await queryRunner.query(`ALTER TABLE \`exercises\` DROP FOREIGN KEY \`FK_026442a164303ee80d7ee175dfe\``);
        await queryRunner.query(`ALTER TABLE \`exercises\` DROP FOREIGN KEY \`FK_2bb208f4a02f1b077c67352fc11\``);
        await queryRunner.query(`DROP TABLE \`sets\``);
        await queryRunner.query(`DROP TABLE \`workout_exercises\``);
        await queryRunner.query(`DROP INDEX \`IDX_4d5de268a0428738521d07bf29\` ON \`workouts\``);
        await queryRunner.query(`DROP TABLE \`workouts\``);
        await queryRunner.query(`DROP TABLE \`exercise_muscles\``);
        await queryRunner.query(`DROP TABLE \`exercises\``);
        await queryRunner.query(`DROP INDEX \`IDX_f98ca1ef4c161f1ada41ed0e9e\` ON \`body_parts\``);
        await queryRunner.query(`DROP TABLE \`body_parts\``);
        await queryRunner.query(`DROP INDEX \`IDX_b44a87bec78c8cf13f5bb83857\` ON \`equipment\``);
        await queryRunner.query(`DROP TABLE \`equipment\``);
    }

}
