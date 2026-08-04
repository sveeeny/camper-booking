import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPasswordResetFields1785880800000
  implements MigrationInterface
{
  name = 'AddUserPasswordResetFields1785880800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "passwordResetTokenHash" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "passwordResetExpiresAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_password_reset_token_hash" ON "user" ("passwordResetTokenHash")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_password_reset_token_hash"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "passwordResetExpiresAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP COLUMN "passwordResetTokenHash"`,
    );
  }
}
