import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedLocations1792417987368 implements MigrationInterface {
    name = 'UpdatedLocations1792417987368'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`locations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`image\` varchar(255) NULL, UNIQUE INDEX \`IDX_227023051ab1fedef7a3b6c7e2\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_227023051ab1fedef7a3b6c7e2\` ON \`locations\``);
        await queryRunner.query(`DROP TABLE \`locations\``);
    }

}
