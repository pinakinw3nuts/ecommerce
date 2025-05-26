import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneNumber1710244252982 implements MigrationInterface {
    name = 'AddPhoneNumber1710244252982'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "phone_number" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "phone_number"
        `);
    }
} 