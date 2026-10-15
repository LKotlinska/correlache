import { MigrationInterface, QueryRunner } from "typeorm";

export class MuscleUniqueNames1792069817830 implements MigrationInterface {
    name = 'MuscleUniqueNames1792069817830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`muscle_groups\` ADD UNIQUE INDEX \`IDX_7b67dd7f791008ed1532e76a9c\` (\`name\`)`);
        await queryRunner.query(`ALTER TABLE \`muscles\` ADD UNIQUE INDEX \`IDX_045c55b12f366cadd2ad0e363f\` (\`name\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`muscles\` DROP INDEX \`IDX_045c55b12f366cadd2ad0e363f\``);
        await queryRunner.query(`ALTER TABLE \`muscle_groups\` DROP INDEX \`IDX_7b67dd7f791008ed1532e76a9c\``);
    }

}
