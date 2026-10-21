import { MigrationInterface, QueryRunner } from "typeorm";

// Intentionally a no-op: the `locations` table (unique name, nullable image)
// is already created by LookupTables + LocationImageNullable. This migration
// was generated against a DB where the table had been dropped, and fails with
// "Table 'locations' already exists" on any DB that ran the earlier ones.
export class UpdatedLocations1792417987368 implements MigrationInterface {
    name = 'UpdatedLocations1792417987368'

    public async up(_queryRunner: QueryRunner): Promise<void> {}

    public async down(_queryRunner: QueryRunner): Promise<void> {}

}
