import { MigrationInterface, QueryRunner } from "typeorm";
export declare class CreateSettings1747398384803 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
