import { MigrationInterface, QueryRunner } from "typeorm";

export class MuscleLookUpTables1792068934870 implements MigrationInterface {
    name = 'MuscleLookUpTables1792068934870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`muscle_groups\` (\`id\` int NOT NULL, \`name\` varchar(50) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`muscles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, \`muscle_group_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`muscles\` ADD CONSTRAINT \`FK_97c14a3154bde81534490d92186\` FOREIGN KEY (\`muscle_group_id\`) REFERENCES \`muscle_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`muscles\` DROP FOREIGN KEY \`FK_97c14a3154bde81534490d92186\``);
        await queryRunner.query(`DROP TABLE \`muscles\``);
        await queryRunner.query(`DROP TABLE \`muscle_groups\``);
    }

}
