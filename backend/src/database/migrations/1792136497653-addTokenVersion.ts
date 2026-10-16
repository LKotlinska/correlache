import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersion1792136497653 implements MigrationInterface {
    name = 'AddTokenVersion1792136497653'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`tokenVersion\``);
    }

}
