import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCountry1710244352982 implements MigrationInterface {
    name = 'AddCountry1710244352982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "country" character varying(2)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "country"
        `);
    }
} 