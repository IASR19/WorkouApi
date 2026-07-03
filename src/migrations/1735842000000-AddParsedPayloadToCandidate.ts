import { MigrationInterface, QueryRunner } from "typeorm";

export class AddParsedPayloadToCandidate1735842000000 implements MigrationInterface {
  name = "AddParsedPayloadToCandidate1735842000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD COLUMN "parsed_payload" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP COLUMN "parsed_payload"`,
    );
  }
}
