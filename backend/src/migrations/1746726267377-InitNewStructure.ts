import { MigrationInterface, QueryRunner } from "typeorm";

export class InitNewStructure1746726267377 implements MigrationInterface {
    name = 'InitNewStructure1746726267377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cars" DROP CONSTRAINT "PK_5f33198d7c6d248969d00c441b9"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "car_row_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "status"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "paymentConfirmed"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "car_slot" integer NOT NULL
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."bookings_source_enum" AS ENUM('guest', 'host')
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "source" "public"."bookings_source_enum" NOT NULL DEFAULT 'guest'
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "notizen" text
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "createdByIp" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "statusUpdatedAt" TIMESTAMP
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "cancelReason" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP CONSTRAINT "FK_4c16c7ef38d1a72e434ebdb180b"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "car_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "car_id" uuid NOT NULL DEFAULT uuid_generate_v4()
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD CONSTRAINT "PK_04ff4e14175e8eba19974f58ac8" PRIMARY KEY ("car_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "booking_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "booking_id" uuid NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "PK_7ff0b5d1ab3fea22169440436f2"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "booking_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "booking_id" uuid NOT NULL DEFAULT uuid_generate_v4()
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "PK_7ff0b5d1ab3fea22169440436f2" PRIMARY KEY ("booking_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD CONSTRAINT "FK_4c16c7ef38d1a72e434ebdb180b" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cars" DROP CONSTRAINT "FK_4c16c7ef38d1a72e434ebdb180b"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ALTER COLUMN "status" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP CONSTRAINT "PK_7ff0b5d1ab3fea22169440436f2"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "booking_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "booking_id" SERIAL NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD CONSTRAINT "PK_7ff0b5d1ab3fea22169440436f2" PRIMARY KEY ("booking_id")
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "booking_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "booking_id" integer NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP CONSTRAINT "PK_04ff4e14175e8eba19974f58ac8"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "car_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "car_id" integer NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD CONSTRAINT "FK_4c16c7ef38d1a72e434ebdb180b" FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "cancelReason"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "statusUpdatedAt"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "createdByIp"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "notizen"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings" DROP COLUMN "source"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."bookings_source_enum"
        `);
        await queryRunner.query(`
            ALTER TABLE "cars" DROP COLUMN "car_slot"
        `);
        await queryRunner.query(`
            ALTER TABLE "bookings"
            ADD "paymentConfirmed" boolean NOT NULL DEFAULT false
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "status" character varying
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD "car_row_id" SERIAL NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "cars"
            ADD CONSTRAINT "PK_5f33198d7c6d248969d00c441b9" PRIMARY KEY ("car_row_id")
        `);
    }

}
