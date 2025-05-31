import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableUuidExtension1689000000000 implements MigrationInterface {
    name = 'EnableUuidExtension1689000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable the uuid-ossp extension for generating UUIDs
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the extension (only if safe to do so)
        await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
    }
} 