import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddDefaultShippingMethods1718580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('Running migration: AddDefaultShippingMethods');

    await queryRunner.query(`
      INSERT INTO "shipping_methods" (
        "id", "name", "code", "description", "baseRate", "estimatedDays", "icon", "isActive", "display_order", "created_at", "updated_at"
      ) VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()),
      ($10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
    `, [
      uuidv4(), 'Standard Shipping', 'STANDARD', 'Reliable and economical shipping option', 5.00, 5, '', true, 1,
      uuidv4(), 'Express Shipping', 'EXPRESS', 'Faster shipping for urgent deliveries', 15.00, 2, '', true, 2
    ]);

    console.log('Default shipping methods added.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('Reverting migration: AddDefaultShippingMethods');

    await queryRunner.query(`
      DELETE FROM "shipping_methods" WHERE "code" IN ('STANDARD', 'EXPRESS')
    `);

    console.log('Default shipping methods removed.');
  }
} 