import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAvatarAndLogo1789150959437 implements MigrationInterface {
    name = 'AddAvatarAndLogo1789150959437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "avatar" text`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "logo" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "logo"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    }

}
