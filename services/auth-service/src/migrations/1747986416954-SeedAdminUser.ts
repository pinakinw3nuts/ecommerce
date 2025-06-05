import { MigrationInterface, QueryRunner } from "typeorm";
import { hash  } from 'bcryptjs';

export class SeedAdminUser1747986416954 implements MigrationInterface {
    name = 'SeedAdminUser1747986416954'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if admin user exists
        const adminExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM users 
                WHERE role = 'ADMIN' 
                AND email = 'admin@example.com'
            );
        `);

        if (!adminExists[0].exists) {
            // Create admin user with hashed password
            const hashedPassword = await hash('admin123', 10);
            
            await queryRunner.query(`
                INSERT INTO users (
                    id,
                    email,
                    password,
                    name,
                    role,
                    status,
                    is_email_verified,
                    created_at,
                    updated_at
                ) VALUES (
                    uuid_generate_v4(),
                    'admin@example.com',
                    $1,
                    'System Admin',
                    'ADMIN',
                    'active',
                    true,
                    NOW(),
                    NOW()
                )
            `, [hashedPassword]);

            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optionally remove the seeded admin user
        await queryRunner.query(`
            DELETE FROM users 
            WHERE email = 'admin@example.com' 
            AND role = 'ADMIN'
        `);
    }
} 