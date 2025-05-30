import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBasePriceToCar1748608071575 implements MigrationInterface {
    name = 'AddBasePriceToCar1748608071575'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cars" ADD "basePrice" numeric(5,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cars" DROP COLUMN "basePrice"`);
    }

}
