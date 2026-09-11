import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1789143757307 implements MigrationInterface {
    name = 'InitSchema1789143757307'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "workoudev"."users_role_enum" AS ENUM('admin', 'recruiter', 'candidate')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "name" character varying NOT NULL, "role" "workoudev"."users_role_enum" NOT NULL DEFAULT 'candidate', "roles" text array NOT NULL DEFAULT '{}', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE TABLE "candidates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "headline" character varying NOT NULL, "location" character varying, "work_model" character varying, "years_experience" integer NOT NULL DEFAULT '0', "skills" text array NOT NULL DEFAULT '{}', "links" text array NOT NULL DEFAULT '{}', "desired_salary" integer, "parsed_payload" jsonb, "userId" uuid, CONSTRAINT "PK_140681296bf033ab1eb95288abb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "workoudev"."resumes_status_enum" AS ENUM('uploaded', 'parsed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "resumes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "file_name" character varying NOT NULL, "storage_url" character varying, "status" "workoudev"."resumes_status_enum" NOT NULL DEFAULT 'uploaded', "parsed_summary" text, "parsed_payload" jsonb, "candidateId" uuid, CONSTRAINT "PK_9c8677802096d6baece48429d2e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "workoudev"."companies_plan_enum" AS ENUM('essencial', 'pro', 'business', 'enterprise')`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "name" character varying NOT NULL, "document" character varying, "website" character varying, "industry" character varying, "plan" "workoudev"."companies_plan_enum", "plan_started_at" TIMESTAMP, "plan_expires_at" TIMESTAMP, "seats_allowed" integer NOT NULL DEFAULT '0', "extra_seats" integer NOT NULL DEFAULT '0', "jobs_per_month" integer NOT NULL DEFAULT '0', "jobs_posted_this_month" integer NOT NULL DEFAULT '0', "extra_jobs" integer NOT NULL DEFAULT '0', "last_job_reset_at" TIMESTAMP, "owner_id" character varying, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_13496c970093729e7ab04eb7da" ON "companies" ("document") `);
        await queryRunner.query(`CREATE TYPE "workoudev"."recruiter_profiles_company_role_enum" AS ENUM('owner', 'manager')`);
        await queryRunner.query(`CREATE TABLE "recruiter_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "company_role" "workoudev"."recruiter_profiles_company_role_enum" NOT NULL DEFAULT 'manager', "is_active" boolean NOT NULL DEFAULT true, "extra_jobs_allowed" integer NOT NULL DEFAULT '0', "jobs_posted_this_month" integer NOT NULL DEFAULT '0', "userId" uuid, "companyId" uuid, CONSTRAINT "PK_5324ae181a3874c303eb1b5280b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "workoudev"."jobs_status_enum" AS ENUM('draft', 'open', 'paused', 'closed')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "title" character varying NOT NULL, "description" text NOT NULL, "requiredSkills" text array NOT NULL DEFAULT '{}', "niceToHaveSkills" text array NOT NULL DEFAULT '{}', "workModel" character varying, "location" character varying, "seniority" character varying, "salary_min" integer, "salary_max" integer, "status" "workoudev"."jobs_status_enum" NOT NULL DEFAULT 'open', "companyId" uuid, "createdById" uuid, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "workoudev"."matches_recruiter_decision_enum" AS ENUM('pending', 'approved', 'skipped')`);
        await queryRunner.query(`CREATE TYPE "workoudev"."matches_candidate_decision_enum" AS ENUM('pending', 'approved', 'skipped')`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "score" integer NOT NULL, "score_reason" text, "recruiter_decision" "workoudev"."matches_recruiter_decision_enum" NOT NULL DEFAULT 'pending', "candidate_decision" "workoudev"."matches_candidate_decision_enum" NOT NULL DEFAULT 'pending', "is_mutual" boolean NOT NULL DEFAULT false, "jobId" uuid, "candidateId" uuid, CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "unlocked" boolean NOT NULL DEFAULT true, "matchId" uuid, CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "body" text NOT NULL, "conversationId" uuid, "senderId" uuid, CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "workoudev"."billing_records_type_enum" AS ENUM('subscription', 'extra_seat', 'extra_job', 'upgrade')`);
        await queryRunner.query(`CREATE TABLE "billing_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "type" "workoudev"."billing_records_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "description" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'authorized', "card_last4" character varying, "metadata" jsonb, "companyId" uuid, CONSTRAINT "PK_11e0a792cf3ae4ebcc71f7fa0ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "candidates" ADD CONSTRAINT "FK_10d0384a816526f8c7f6b1e67b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resumes" ADD CONSTRAINT "FK_ef209c1dcfaf4143a091de22f0c" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_ca24c92565dce0e06bb3b2a039e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_be306bf144a70a0023a30f32ac0" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_6ce4483dc65ed9d2e171269d801" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_942364c910910a09a018566455e" FOREIGN KEY ("createdById") REFERENCES "recruiter_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_c78636ff8f8f666c6dc04155c57" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_30d4215bb287e3b67de9a538526" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversations" ADD CONSTRAINT "FK_b44664e3eff29bd73e2c5cdc4c8" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "billing_records" ADD CONSTRAINT "FK_30e16f165b29cc30dd75481aef3" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billing_records" DROP CONSTRAINT "FK_30e16f165b29cc30dd75481aef3"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_b44664e3eff29bd73e2c5cdc4c8"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_30d4215bb287e3b67de9a538526"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_c78636ff8f8f666c6dc04155c57"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_942364c910910a09a018566455e"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_6ce4483dc65ed9d2e171269d801"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_be306bf144a70a0023a30f32ac0"`);
        await queryRunner.query(`ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_ca24c92565dce0e06bb3b2a039e"`);
        await queryRunner.query(`ALTER TABLE "resumes" DROP CONSTRAINT "FK_ef209c1dcfaf4143a091de22f0c"`);
        await queryRunner.query(`ALTER TABLE "candidates" DROP CONSTRAINT "FK_10d0384a816526f8c7f6b1e67b3"`);
        await queryRunner.query(`DROP TABLE "billing_records"`);
        await queryRunner.query(`DROP TYPE "workoudev"."billing_records_type_enum"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TYPE "workoudev"."matches_candidate_decision_enum"`);
        await queryRunner.query(`DROP TYPE "workoudev"."matches_recruiter_decision_enum"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "workoudev"."jobs_status_enum"`);
        await queryRunner.query(`DROP TABLE "recruiter_profiles"`);
        await queryRunner.query(`DROP TYPE "workoudev"."recruiter_profiles_company_role_enum"`);
        await queryRunner.query(`DROP INDEX "workoudev"."IDX_13496c970093729e7ab04eb7da"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TYPE "workoudev"."companies_plan_enum"`);
        await queryRunner.query(`DROP TABLE "resumes"`);
        await queryRunner.query(`DROP TYPE "workoudev"."resumes_status_enum"`);
        await queryRunner.query(`DROP TABLE "candidates"`);
        await queryRunner.query(`DROP INDEX "workoudev"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "workoudev"."users_role_enum"`);
    }

}
