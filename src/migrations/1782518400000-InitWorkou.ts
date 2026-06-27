import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitWorkou1782518400000 implements MigrationInterface {
  name = 'InitWorkou1782518400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('admin', 'recruiter', 'candidate')`);
    await queryRunner.query(`CREATE TYPE "job_status_enum" AS ENUM ('draft', 'open', 'paused', 'closed')`);
    await queryRunner.query(`CREATE TYPE "resume_status_enum" AS ENUM ('uploaded', 'parsed', 'failed')`);
    await queryRunner.query(`CREATE TYPE "match_decision_enum" AS ENUM ('pending', 'approved', 'skipped')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "name" varchar NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'candidate',
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "name" varchar NOT NULL,
        "document" varchar,
        "website" varchar,
        "industry" varchar,
        CONSTRAINT "UQ_companies_document" UNIQUE ("document"),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "title" varchar NOT NULL,
        "description" text NOT NULL,
        "requiredSkills" text[] NOT NULL DEFAULT '{}',
        "niceToHaveSkills" text[] NOT NULL DEFAULT '{}',
        "workModel" varchar,
        "location" varchar,
        "seniority" varchar,
        "salary_min" integer,
        "salary_max" integer,
        "status" "job_status_enum" NOT NULL DEFAULT 'open',
        "companyId" uuid,
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "headline" varchar NOT NULL,
        "location" varchar,
        "work_model" varchar,
        "years_experience" integer NOT NULL DEFAULT 0,
        "skills" text[] NOT NULL DEFAULT '{}',
        "links" text[] NOT NULL DEFAULT '{}',
        "desired_salary" integer,
        "userId" uuid,
        CONSTRAINT "PK_candidates" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "resumes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "file_name" varchar NOT NULL,
        "storage_url" varchar,
        "status" "resume_status_enum" NOT NULL DEFAULT 'uploaded',
        "parsed_summary" text,
        "parsed_payload" jsonb,
        "candidateId" uuid NOT NULL,
        CONSTRAINT "PK_resumes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "matches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "score" integer NOT NULL,
        "score_reason" text,
        "recruiter_decision" "match_decision_enum" NOT NULL DEFAULT 'pending',
        "candidate_decision" "match_decision_enum" NOT NULL DEFAULT 'pending',
        "is_mutual" boolean NOT NULL DEFAULT false,
        "jobId" uuid NOT NULL,
        "candidateId" uuid NOT NULL,
        CONSTRAINT "PK_matches" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "unlocked" boolean NOT NULL DEFAULT true,
        "matchId" uuid NOT NULL,
        CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "body" text NOT NULL,
        "conversationId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        CONSTRAINT "PK_messages" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id")`);
    await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_candidates_user" FOREIGN KEY ("userId") REFERENCES "users"("id")`);
    await queryRunner.query(`ALTER TABLE "resumes" ADD CONSTRAINT "FK_resumes_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id")`);
    await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_matches_job" FOREIGN KEY ("jobId") REFERENCES "jobs"("id")`);
    await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_matches_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id")`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_match" FOREIGN KEY ("matchId") REFERENCES "matches"("id")`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id")`);
    await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "resumes"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TABLE "companies"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "match_decision_enum"`);
    await queryRunner.query(`DROP TYPE "resume_status_enum"`);
    await queryRunner.query(`DROP TYPE "job_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
  }
}

