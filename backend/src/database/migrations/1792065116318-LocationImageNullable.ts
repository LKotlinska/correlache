import { MigrationInterface, QueryRunner } from "typeorm";

export class LocationImageNullable1792065116318 implements MigrationInterface {
    name = 'LocationImageNullable1792065116318'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_3e8e12ac84ddd31d88c02f2efa\` ON \`locations\``);
        await queryRunner.query(`ALTER TABLE \`locations\` CHANGE \`image\` \`image\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`locations\` CHANGE \`image\` \`image\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_3e8e12ac84ddd31d88c02f2efa\` ON \`locations\` (\`image\`)`);
    }

}
