import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHeadaches1792495652511 implements MigrationInterface {
    name = 'AddHeadaches1792495652511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`headaches\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(36) NOT NULL, \`started_at\` datetime NOT NULL, \`ended_at\` datetime NULL, \`pain_level\` tinyint NOT NULL, \`notes\` text NULL, INDEX \`IDX_9ebbab545699cb880747e8d29c\` (\`user_id\`, \`started_at\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`headache_triggers\` (\`headache_id\` varchar(36) NOT NULL, \`trigger_id\` int NOT NULL, INDEX \`IDX_9960d43303698a3cac32af8daa\` (\`headache_id\`), INDEX \`IDX_7a093ace481952c889414055fd\` (\`trigger_id\`), PRIMARY KEY (\`headache_id\`, \`trigger_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`headache_symptoms\` (\`headache_id\` varchar(36) NOT NULL, \`symptom_id\` int NOT NULL, INDEX \`IDX_404a62c09f1defa20dc4d74666\` (\`headache_id\`), INDEX \`IDX_b49e58752193368dad085b4f79\` (\`symptom_id\`), PRIMARY KEY (\`headache_id\`, \`symptom_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`headache_relief\` (\`headache_id\` varchar(36) NOT NULL, \`relief_measure_id\` int NOT NULL, INDEX \`IDX_377be8fb43b05e73d2adf5a8d3\` (\`headache_id\`), INDEX \`IDX_e182c88860b3cc79e03669aa1e\` (\`relief_measure_id\`), PRIMARY KEY (\`headache_id\`, \`relief_measure_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`headache_locations\` (\`headache_id\` varchar(36) NOT NULL, \`location_id\` int NOT NULL, INDEX \`IDX_fbac2918f49793f01c89a88dcc\` (\`headache_id\`), INDEX \`IDX_c04bd7ba595edce15c555af60d\` (\`location_id\`), PRIMARY KEY (\`headache_id\`, \`location_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`headaches\` ADD CONSTRAINT \`FK_beff7ff16cb3f6950aa76fc9fa1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`headache_triggers\` ADD CONSTRAINT \`FK_9960d43303698a3cac32af8daa3\` FOREIGN KEY (\`headache_id\`) REFERENCES \`headaches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_triggers\` ADD CONSTRAINT \`FK_7a093ace481952c889414055fda\` FOREIGN KEY (\`trigger_id\`) REFERENCES \`triggers\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_symptoms\` ADD CONSTRAINT \`FK_404a62c09f1defa20dc4d74666c\` FOREIGN KEY (\`headache_id\`) REFERENCES \`headaches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_symptoms\` ADD CONSTRAINT \`FK_b49e58752193368dad085b4f79e\` FOREIGN KEY (\`symptom_id\`) REFERENCES \`symptoms\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_relief\` ADD CONSTRAINT \`FK_377be8fb43b05e73d2adf5a8d31\` FOREIGN KEY (\`headache_id\`) REFERENCES \`headaches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_relief\` ADD CONSTRAINT \`FK_e182c88860b3cc79e03669aa1e8\` FOREIGN KEY (\`relief_measure_id\`) REFERENCES \`relief_measures\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_locations\` ADD CONSTRAINT \`FK_fbac2918f49793f01c89a88dccd\` FOREIGN KEY (\`headache_id\`) REFERENCES \`headaches\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`headache_locations\` ADD CONSTRAINT \`FK_c04bd7ba595edce15c555af60d4\` FOREIGN KEY (\`location_id\`) REFERENCES \`locations\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`headache_locations\` DROP FOREIGN KEY \`FK_c04bd7ba595edce15c555af60d4\``);
        await queryRunner.query(`ALTER TABLE \`headache_locations\` DROP FOREIGN KEY \`FK_fbac2918f49793f01c89a88dccd\``);
        await queryRunner.query(`ALTER TABLE \`headache_relief\` DROP FOREIGN KEY \`FK_e182c88860b3cc79e03669aa1e8\``);
        await queryRunner.query(`ALTER TABLE \`headache_relief\` DROP FOREIGN KEY \`FK_377be8fb43b05e73d2adf5a8d31\``);
        await queryRunner.query(`ALTER TABLE \`headache_symptoms\` DROP FOREIGN KEY \`FK_b49e58752193368dad085b4f79e\``);
        await queryRunner.query(`ALTER TABLE \`headache_symptoms\` DROP FOREIGN KEY \`FK_404a62c09f1defa20dc4d74666c\``);
        await queryRunner.query(`ALTER TABLE \`headache_triggers\` DROP FOREIGN KEY \`FK_7a093ace481952c889414055fda\``);
        await queryRunner.query(`ALTER TABLE \`headache_triggers\` DROP FOREIGN KEY \`FK_9960d43303698a3cac32af8daa3\``);
        await queryRunner.query(`ALTER TABLE \`headaches\` DROP FOREIGN KEY \`FK_beff7ff16cb3f6950aa76fc9fa1\``);
        await queryRunner.query(`DROP INDEX \`IDX_c04bd7ba595edce15c555af60d\` ON \`headache_locations\``);
        await queryRunner.query(`DROP INDEX \`IDX_fbac2918f49793f01c89a88dcc\` ON \`headache_locations\``);
        await queryRunner.query(`DROP TABLE \`headache_locations\``);
        await queryRunner.query(`DROP INDEX \`IDX_e182c88860b3cc79e03669aa1e\` ON \`headache_relief\``);
        await queryRunner.query(`DROP INDEX \`IDX_377be8fb43b05e73d2adf5a8d3\` ON \`headache_relief\``);
        await queryRunner.query(`DROP TABLE \`headache_relief\``);
        await queryRunner.query(`DROP INDEX \`IDX_b49e58752193368dad085b4f79\` ON \`headache_symptoms\``);
        await queryRunner.query(`DROP INDEX \`IDX_404a62c09f1defa20dc4d74666\` ON \`headache_symptoms\``);
        await queryRunner.query(`DROP TABLE \`headache_symptoms\``);
        await queryRunner.query(`DROP INDEX \`IDX_7a093ace481952c889414055fd\` ON \`headache_triggers\``);
        await queryRunner.query(`DROP INDEX \`IDX_9960d43303698a3cac32af8daa\` ON \`headache_triggers\``);
        await queryRunner.query(`DROP TABLE \`headache_triggers\``);
        await queryRunner.query(`DROP INDEX \`IDX_9ebbab545699cb880747e8d29c\` ON \`headaches\``);
        await queryRunner.query(`DROP TABLE \`headaches\``);
    }

}
