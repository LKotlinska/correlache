import { MigrationInterface, QueryRunner } from "typeorm";

const RENAMES = [
    { table: 'locations', joinTable: 'headache_locations', joinColumn: 'location_id', from: 'Around right eye', to: 'Behind right eye' },
    { table: 'symptoms', joinTable: 'headache_symptoms', joinColumn: 'symptom_id', from: 'Neck stiffness', to: 'Neck or shoulder stiffness' },
];

type Rename = (typeof RENAMES)[number];

// The seeder upserts by name, so a renamed lookup would be inserted as a new row and leave the old one behind.
// Renaming in place keeps the id, so headaches already logged keep their location and symptoms.
export class RenameLookups1793000000000 implements MigrationInterface {
    name = 'RenameLookups1793000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const rename of RENAMES) await this.rename(queryRunner, rename, rename.from, rename.to);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const rename of RENAMES) await this.rename(queryRunner, rename, rename.to, rename.from);
    }

    /**
     * Renames `from` to `to`. When the seeder already inserted `to`, the unique name would reject the update,
     * so headaches using `from` are moved over to `to` and `from` is deleted instead.
     */
    private async rename(queryRunner: QueryRunner, { table, joinTable, joinColumn }: Rename, from: string, to: string) {
        const [old] = await queryRunner.query(`SELECT \`id\` FROM \`${table}\` WHERE \`name\` = ?`, [from]);
        if (!old) return;

        const [target] = await queryRunner.query(`SELECT \`id\` FROM \`${table}\` WHERE \`name\` = ?`, [to]);
        if (!target) {
            await queryRunner.query(`UPDATE \`${table}\` SET \`name\` = ? WHERE \`id\` = ?`, [to, old.id]);
            return;
        }

        // IGNORE skips headaches that already have both the old and the new lookup
        await queryRunner.query(
            `INSERT IGNORE INTO \`${joinTable}\` (\`headache_id\`, \`${joinColumn}\`)
             SELECT \`headache_id\`, ? FROM \`${joinTable}\` WHERE \`${joinColumn}\` = ?`,
            [target.id, old.id],
        );
        await queryRunner.query(`DELETE FROM \`${joinTable}\` WHERE \`${joinColumn}\` = ?`, [old.id]);
        await queryRunner.query(`DELETE FROM \`${table}\` WHERE \`id\` = ?`, [old.id]);
    }
}
