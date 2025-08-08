import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductsTagsJoinTable1700000000005 implements MigrationInterface {
  name = 'CreateProductsTagsJoinTable1700000000005'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create join table expected by TypeORM for Product <-> Tag many-to-many
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "products_tags_tags" (
        "productsId" uuid NOT NULL,
        "tagsId" uuid NOT NULL,
        CONSTRAINT "PK_products_tags" PRIMARY KEY ("productsId", "tagsId"),
        CONSTRAINT "FK_products_tags_product" FOREIGN KEY ("productsId") REFERENCES "products"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_products_tags_tag" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_tags_products" ON "products_tags_tags" ("productsId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_products_tags_tags" ON "products_tags_tags" ("tagsId");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products_tags_tags";`);
  }
}


