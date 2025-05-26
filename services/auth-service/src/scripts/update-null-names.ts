import { AppDataSource } from '../data-source';

async function updateNullNames() {
    try {
        await AppDataSource.initialize();
        
        // Update NULL names with defaults
        await AppDataSource.query(`
            UPDATE "users" 
            SET "name" = COALESCE(
                "name",
                SPLIT_PART(email, '@', 1), 
                'User_' || SUBSTRING(id::text, 1, 8)
            )
            WHERE "name" IS NULL
        `);
        
        console.log('Successfully updated NULL names');
        
        // Now we can update the schema to make name NOT NULL
        await AppDataSource.query(`ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL`);
        
        console.log('Successfully made name column NOT NULL');
        
    } catch (error) {
        console.error('Error updating names:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

updateNullNames().catch(console.error); 