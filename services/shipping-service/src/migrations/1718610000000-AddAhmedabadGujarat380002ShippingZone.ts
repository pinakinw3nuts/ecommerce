import { MigrationInterface, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class AddAhmedabadGujarat380002ShippingZone1718610000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create the shipping zone
    const zoneId = uuidv4();
    await queryRunner.query(`
      INSERT INTO "shipping_zones" (
        "id", "name", "code", "description", "countries", "regions", "pincodePatterns", "isActive", "priority", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      )
    `, [
      zoneId,
      'Ahmedabad Gujarat 380002',
      'AHMEDABAD_GJ_380002',
      'Zone for Ahmedabad, Gujarat, India, pincode 380002',
      '{IN}',
      JSON.stringify([{ country: 'IN', state: 'Gujarat', city: 'Ahmedabad', pincode: '380002' }]),
      '{380002}',
      true,
      10
    ]);

    // 2. Get Standard and Express shipping method IDs
    const standardMethod = await queryRunner.query(`SELECT id FROM "shipping_methods" WHERE code = 'STANDARD' LIMIT 1`);
    const expressMethod = await queryRunner.query(`SELECT id FROM "shipping_methods" WHERE code = 'EXPRESS' LIMIT 1`);
    if (!standardMethod[0] || !expressMethod[0]) {
      throw new Error('Standard or Express shipping method not found.');
    }
    const standardMethodId = standardMethod[0].id;
    const expressMethodId = expressMethod[0].id;

    // 3. Associate methods with the zone
    await queryRunner.query(`
      INSERT INTO "shipping_method_zones" ("shipping_method_id", "shipping_zone_id") VALUES ($1, $2), ($3, $2)
    `, [standardMethodId, zoneId, expressMethodId]);

    // 4. Add shipping rates - UPDATED to store method IDs and zone ID properly
    await queryRunner.query(`
      INSERT INTO "shipping_rates" (
        "id", "name", "rate", "shipping_method_id", "shipping_zone_id", "isActive", "estimated_days", "createdAt", "updatedAt"
      ) VALUES
      ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()),
      ($8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    `, [
      uuidv4(), 'Standard Shipping (Ahmedabad 380002)', 60, standardMethodId, zoneId, true, 3,
      uuidv4(), 'Express Shipping (Ahmedabad 380002)', 120, expressMethodId, zoneId, true, 1
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove rates, associations, and zone
    const zone = await queryRunner.query(`SELECT id FROM "shipping_zones" WHERE code = 'AHMEDABAD_GJ_380002' LIMIT 1`);
    if (!zone[0]) return;
    const zoneId = zone[0].id;
    await queryRunner.query(`DELETE FROM "shipping_rates" WHERE "shipping_zone_id" = $1`, [zoneId]);
    await queryRunner.query(`DELETE FROM "shipping_method_zones" WHERE "shipping_zone_id" = $1`, [zoneId]);
    await queryRunner.query(`DELETE FROM "shipping_zones" WHERE "id" = $1`, [zoneId]);
  }
} 