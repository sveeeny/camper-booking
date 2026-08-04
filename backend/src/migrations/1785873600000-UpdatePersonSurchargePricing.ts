import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePersonSurchargePricing1785873600000
  implements MigrationInterface
{
  name = 'UpdatePersonSurchargePricing1785873600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "adultTax" SET DEFAULT 4',
    );
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "childTax" SET DEFAULT 4',
    );
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "pricePerNightPerCar" SET DEFAULT 26',
    );
    await queryRunner.query(
      'UPDATE "settings" SET "adultTax" = 4, "childTax" = 4, "pricePerNightPerCar" = 26 WHERE "id" = \'singleton\'',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE "settings" SET "adultTax" = 2, "childTax" = 0, "pricePerNightPerCar" = 30 WHERE "id" = \'singleton\' AND "adultTax" = 4 AND "childTax" = 4 AND "pricePerNightPerCar" = 26',
    );
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "pricePerNightPerCar" SET DEFAULT 30',
    );
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "childTax" SET DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE "settings" ALTER COLUMN "adultTax" SET DEFAULT 2',
    );
  }
}
