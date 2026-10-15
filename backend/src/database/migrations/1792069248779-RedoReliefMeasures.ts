import { MigrationInterface, QueryRunner } from "typeorm";

export class RedoReliefMeasures1792069248779 implements MigrationInterface {
    name = 'RedoReliefMeasures1792069248779'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`relief_measures\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(50) NOT NULL, UNIQUE INDEX \`IDX_e43e7556bbe8c84fd87b049f5b\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_e43e7556bbe8c84fd87b049f5b\` ON \`relief_measures\``);
        await queryRunner.query(`DROP TABLE \`relief_measures\``);
    }

}
