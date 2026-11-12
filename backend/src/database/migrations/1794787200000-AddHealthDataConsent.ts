import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHealthDataConsent1794787200000 implements MigrationInterface {
    name = 'AddHealthDataConsent1794787200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Nullable: existing accounts never gave recorded consent, and we don't backfill one for them
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`health_data_consent_at\` datetime NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`health_data_consent_at\``);
    }

}
