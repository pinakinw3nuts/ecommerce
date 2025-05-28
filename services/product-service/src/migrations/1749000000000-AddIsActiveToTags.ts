import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveToTags1749000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the column already exists
        const hasColumn = await queryRunner.hasColumn('tag', 'isActive');
        
        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "tag" 
                ADD COLUMN "isActive" boolean NOT NULL DEFAULT true
            `);
            
            console.log('Added isActive column to tag table');
        } else {
            console.log('isActive column already exists in tag table');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('tag', 'isActive');
        
        if (hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "tag" 
                DROP COLUMN "isActive"
            `);
            
            console.log('Removed isActive column from tag table');
        }
    }
} 