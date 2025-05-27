import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFullTextSearchIndex1689432000000 implements MigrationInterface {
    name = 'AddFullTextSearchIndex1689432000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create a GIN index for full-text search on product name and description
        await queryRunner.query(`
            CREATE INDEX idx_product_fts ON product 
            USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index if rolling back
        await queryRunner.query(`DROP INDEX IF EXISTS idx_product_fts`);
    }
} 