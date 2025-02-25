import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAssignedSpots1719318400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "booking"
            ADD COLUMN "assignedSpots" integer[] DEFAULT '{}'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "booking"
            DROP COLUMN "assignedSpots"
        `);
    }
}
