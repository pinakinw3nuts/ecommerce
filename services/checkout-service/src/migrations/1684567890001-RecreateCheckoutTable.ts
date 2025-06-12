import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class RecreateCheckoutTable1684567890001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "checkout_sessions",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "user_id",
                        type: "varchar",
                    },
                    {
                        name: "cart_snapshot",
                        type: "jsonb",
                    },
                    {
                        name: "totals",
                        type: "jsonb",
                    },
                    {
                        name: "shipping_cost",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "tax",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "discount_code",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["PENDING", "COMPLETED", "EXPIRED", "FAILED"],
                        default: "'PENDING'",
                    },
                    {
                        name: "shipping_address",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "billing_address",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "payment_intent_id",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "expires_at",
                        type: "timestamp with time zone",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp with time zone",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp with time zone",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        // Create extension for UUID if not exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Add index on user_id for faster lookups
        await queryRunner.createIndex(
            "checkout_sessions",
            new TableIndex({
                name: "IDX_CHECKOUT_USER_ID",
                columnNames: ["user_id"],
            })
        );

        // Add index on status for faster filtering
        await queryRunner.createIndex(
            "checkout_sessions",
            new TableIndex({
                name: "IDX_CHECKOUT_STATUS",
                columnNames: ["status"],
            })
        );

        // Add index on expires_at for cleanup jobs
        await queryRunner.createIndex(
            "checkout_sessions",
            new TableIndex({
                name: "IDX_CHECKOUT_EXPIRES_AT",
                columnNames: ["expires_at"],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex("checkout_sessions", "IDX_CHECKOUT_USER_ID");
        await queryRunner.dropIndex("checkout_sessions", "IDX_CHECKOUT_STATUS");
        await queryRunner.dropIndex("checkout_sessions", "IDX_CHECKOUT_EXPIRES_AT");
        
        // Drop table
        await queryRunner.dropTable("checkout_sessions");
    }
} 