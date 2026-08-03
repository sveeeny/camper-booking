import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentDeliveryTracking1785787200000
  implements MigrationInterface
{
  name = 'AddPaymentDeliveryTracking1785787200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD "stripeCheckoutSessionId" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD "paymentConfirmedAt" TIMESTAMP',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD "confirmationProcessingAt" TIMESTAMP',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD "confirmationSentAt" TIMESTAMP',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" ADD "confirmationLastError" text',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_bookings_stripeCheckoutSessionId" ON "bookings" ("stripeCheckoutSessionId") WHERE "stripeCheckoutSessionId" IS NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "public"."IDX_bookings_stripeCheckoutSessionId"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP COLUMN "confirmationLastError"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP COLUMN "confirmationSentAt"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP COLUMN "confirmationProcessingAt"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP COLUMN "paymentConfirmedAt"',
    );
    await queryRunner.query(
      'ALTER TABLE "bookings" DROP COLUMN "stripeCheckoutSessionId"',
    );
  }
}
