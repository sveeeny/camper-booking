import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSettings1747398384803 implements MigrationInterface {
    name = 'CreateSettings1747398384803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "settings" ("id" character varying NOT NULL DEFAULT 'singleton', "adultTax" numeric NOT NULL DEFAULT '2', "childTax" numeric NOT NULL DEFAULT '0', "pricePerNightPerCar" numeric NOT NULL DEFAULT '30', "maxGuestsPerCar" integer NOT NULL DEFAULT '5', "bookingAdvanceDays" integer NOT NULL DEFAULT '180', "minNights" integer NOT NULL DEFAULT '1', "maxNights" integer NOT NULL DEFAULT '30', "checkInTime" character varying NOT NULL DEFAULT '13:00', "checkOutTime" character varying NOT NULL DEFAULT '12:00', "cancellationWindow" integer NOT NULL DEFAULT '7', "cancellationFee" numeric NOT NULL DEFAULT '20', CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'draft'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TABLE "settings"`);
    }

}
