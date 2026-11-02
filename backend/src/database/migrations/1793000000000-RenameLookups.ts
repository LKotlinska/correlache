import { MigrationInterface, QueryRunner } from "typeorm";

const RENAMES = [
    { table: 'locations', from: 'Around right eye', to: 'Behind right eye' },
    { table: 'symptoms', from: 'Neck stiffness', to: 'Neck or shoulder stiffness' },
];

// The seeder upserts by name, so a renamed lookup would be inserted as a new row and leave the old one behind.
// Renaming in place keeps the id, so headaches already logged keep their location and symptoms.
export class RenameLookups1793000000000 implements MigrationInterface {
    name = 'RenameLookups1793000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const { table, from, to } of RENAMES) await this.rename(queryRunner, table, from, to);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const { table, from, to } of RENAMES) await this.rename(queryRunner, table, to, from);
    }

    /** Skips when the new name already exists, as the unique name would reject the update. */
    private async rename(queryRunner: QueryRunner, table: string, from: string, to: string) {
        const existing = await queryRunner.query(`SELECT 1 FROM \`${table}\` WHERE \`name\` = ?`, [to]);
        if (existing.length) return;
        await queryRunner.query(`UPDATE \`${table}\` SET \`name\` = ? WHERE \`name\` = ?`, [to, from]);
    }
}
