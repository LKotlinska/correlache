import { MigrationInterface, QueryRunner } from "typeorm";

export class LookupTables1792064449616 implements MigrationInterface {
    name = 'LookupTables1792064449616'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`locations\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`image\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_227023051ab1fedef7a3b6c7e2\` (\`name\`), UNIQUE INDEX \`IDX_3e8e12ac84ddd31d88c02f2efa\` (\`image\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`relief_measures\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_e43e7556bbe8c84fd87b049f5b\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`symptoms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_b164d6568d7710d8e0076f6392\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`triggers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_9770d9e9a67dffde56240fa4db\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_9770d9e9a67dffde56240fa4db\` ON \`triggers\``);
        await queryRunner.query(`DROP TABLE \`triggers\``);
        await queryRunner.query(`DROP INDEX \`IDX_b164d6568d7710d8e0076f6392\` ON \`symptoms\``);
        await queryRunner.query(`DROP TABLE \`symptoms\``);
        await queryRunner.query(`DROP INDEX \`IDX_e43e7556bbe8c84fd87b049f5b\` ON \`relief_measures\``);
        await queryRunner.query(`DROP TABLE \`relief_measures\``);
        await queryRunner.query(`DROP INDEX \`IDX_3e8e12ac84ddd31d88c02f2efa\` ON \`locations\``);
        await queryRunner.query(`DROP INDEX \`IDX_227023051ab1fedef7a3b6c7e2\` ON \`locations\``);
        await queryRunner.query(`DROP TABLE \`locations\``);
    }

}
