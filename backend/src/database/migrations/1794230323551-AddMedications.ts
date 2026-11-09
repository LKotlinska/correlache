import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMedications1794230323551 implements MigrationInterface {
    name = 'AddMedications1794230323551'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`medications\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`name\` varchar(100) NOT NULL, \`class\` enum ('simple_painkiller', 'nsaid', 'triptan', 'ergot', 'opioid', 'combination', 'preventive', 'other') NOT NULL, \`default_dose\` varchar(50) NULL, \`use\` enum ('as_needed', 'preventive') NOT NULL DEFAULT 'as_needed', \`archived_at\` datetime NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_3e8541ed0c975ed90ca265bb46\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`medication_intakes\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`medication_id\` varchar(36) NOT NULL, \`taken_at\` datetime NOT NULL, \`dose\` varchar(50) NULL, \`headache_id\` varchar(36) NULL, \`effect\` enum ('none', 'some', 'full') NULL, \`effect_at\` datetime NULL, INDEX \`IDX_62fcfbfe2467cff0afcfc9df69\` (\`user_id\`, \`taken_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`medications\` ADD CONSTRAINT \`FK_3e8541ed0c975ed90ca265bb468\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` ADD CONSTRAINT \`FK_e4012fbf37101392176239fd05d\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` ADD CONSTRAINT \`FK_91882e15da3ee85a871d42a093d\` FOREIGN KEY (\`medication_id\`) REFERENCES \`medications\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` ADD CONSTRAINT \`FK_e1362015d2181ae9208c84854ae\` FOREIGN KEY (\`headache_id\`) REFERENCES \`headaches\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` DROP FOREIGN KEY \`FK_e1362015d2181ae9208c84854ae\``);
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` DROP FOREIGN KEY \`FK_91882e15da3ee85a871d42a093d\``);
        await queryRunner.query(`ALTER TABLE \`medication_intakes\` DROP FOREIGN KEY \`FK_e4012fbf37101392176239fd05d\``);
        await queryRunner.query(`ALTER TABLE \`medications\` DROP FOREIGN KEY \`FK_3e8541ed0c975ed90ca265bb468\``);
        await queryRunner.query(`DROP INDEX \`IDX_62fcfbfe2467cff0afcfc9df69\` ON \`medication_intakes\``);
        await queryRunner.query(`DROP TABLE \`medication_intakes\``);
        await queryRunner.query(`DROP INDEX \`IDX_3e8541ed0c975ed90ca265bb46\` ON \`medications\``);
        await queryRunner.query(`DROP TABLE \`medications\``);
    }

}
