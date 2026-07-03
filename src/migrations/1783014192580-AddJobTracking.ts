import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobTracking1783014192580 implements MigrationInterface {
  name = "AddJobTracking1783014192580";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recruiter_profiles table
    await queryRunner.query(
      `CREATE TYPE "workoudev"."recruiter_role_enum" AS ENUM('owner', 'manager')`,
    );
    await queryRunner.query(`
      CREATE TABLE "recruiter_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "company_role" "workoudev"."recruiter_role_enum" NOT NULL DEFAULT 'manager',
        "is_active" boolean NOT NULL DEFAULT true,
        "extra_jobs_allowed" integer NOT NULL DEFAULT 0,
        "jobs_posted_this_month" integer NOT NULL DEFAULT 0,
        "userId" uuid,
        "companyId" uuid,
        CONSTRAINT "PK_recruiter_profiles" PRIMARY KEY ("id")
      )
    `);

    // Create billing_records table
    await queryRunner.query(
      `CREATE TYPE "workoudev"."billing_type_enum" AS ENUM('subscription', 'extra_seat', 'extra_job', 'upgrade')`,
    );
    await queryRunner.query(`
      CREATE TABLE "billing_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        "type" "workoudev"."billing_type_enum" NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "description" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'authorized',
        "card_last4" varchar,
        "metadata" jsonb,
        "companyId" uuid,
        CONSTRAINT "PK_billing_records" PRIMARY KEY ("id")
      )
    `);

    // Drop and recreate foreign key constraints for existing tables
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_candidates_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP CONSTRAINT "FK_resumes_candidate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_jobs_company"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_matches_candidate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_matches_job"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_sender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_match"`,
    );

    // Add createdById column to jobs
    await queryRunner.query(`ALTER TABLE "jobs" ADD "createdById" uuid`);

    // Add roles column and update users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "roles" text[] NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_email"`,
    );
    await queryRunner.query(
      `ALTER TYPE "workoudev"."user_role_enum" RENAME TO "user_role_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."users_role_enum" AS ENUM('admin', 'recruiter', 'candidate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "workoudev"."users_role_enum" USING "role"::"text"::"workoudev"."users_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'candidate'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."user_role_enum_old"`);

    // Update resumes table
    await queryRunner.query(
      `ALTER TYPE "workoudev"."resume_status_enum" RENAME TO "resume_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."resumes_status_enum" AS ENUM('uploaded', 'parsed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" TYPE "workoudev"."resumes_status_enum" USING "status"::"text"::"workoudev"."resumes_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" SET DEFAULT 'uploaded'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."resume_status_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "candidateId" DROP NOT NULL`,
    );

    // Update companies table
    await queryRunner.query(
      `ALTER TABLE "companies" DROP CONSTRAINT "UQ_companies_document"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."plan_type_enum" AS ENUM('essencial', 'pro', 'business', 'enterprise')`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "plan" "workoudev"."plan_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "plan_started_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "plan_expires_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "seats_allowed" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "extra_seats" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "jobs_per_month" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "jobs_posted_this_month" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "extra_jobs" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "last_job_reset_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD COLUMN "owner_id" character varying`,
    );

    // Update jobs table
    await queryRunner.query(
      `ALTER TYPE "workoudev"."job_status_enum" RENAME TO "job_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."jobs_status_enum" AS ENUM('draft', 'open', 'paused', 'closed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "workoudev"."jobs_status_enum" USING "status"::"text"::"workoudev"."jobs_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."job_status_enum_old"`);

    // Update matches table
    await queryRunner.query(
      `ALTER TYPE "workoudev"."match_decision_enum" RENAME TO "match_decision_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."matches_recruiter_decision_enum" AS ENUM('pending', 'approved', 'skipped')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" TYPE "workoudev"."matches_recruiter_decision_enum" USING "recruiter_decision"::"text"::"workoudev"."matches_recruiter_decision_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."matches_candidate_decision_enum" AS ENUM('pending', 'approved', 'skipped')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" TYPE "workoudev"."matches_candidate_decision_enum" USING "candidate_decision"::"text"::"workoudev"."matches_candidate_decision_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."match_decision_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "jobId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidateId" DROP NOT NULL`,
    );

    // Update messages table
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "conversationId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "senderId" DROP NOT NULL`,
    );

    // Update conversations table
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "matchId" DROP NOT NULL`,
    );

    // Create unique indexes
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_13496c970093729e7ab04eb7da" ON "companies" ("document") `,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_10d0384a816526f8c7f6b1e67b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD CONSTRAINT "FK_ef209c1dcfaf4143a091de22f0c" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_ca24c92565dce0e06bb3b2a039e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "FK_be306bf144a70a0023a30f32ac0" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_6ce4483dc65ed9d2e171269d801" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_942364c910910a09a018566455e" FOREIGN KEY ("createdById") REFERENCES "recruiter_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_c78636ff8f8f666c6dc04155c57" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_30d4215bb287e3b67de9a538526" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_b44664e3eff29bd73e2c5cdc4c8" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" ADD CONSTRAINT "FK_30e16f165b29cc30dd75481aef3" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "billing_records" DROP CONSTRAINT "FK_30e16f165b29cc30dd75481aef3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" DROP CONSTRAINT "FK_b44664e3eff29bd73e2c5cdc4c8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_30d4215bb287e3b67de9a538526"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" DROP CONSTRAINT "FK_c78636ff8f8f666c6dc04155c57"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_942364c910910a09a018566455e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" DROP CONSTRAINT "FK_6ce4483dc65ed9d2e171269d801"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_be306bf144a70a0023a30f32ac0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" DROP CONSTRAINT "FK_ca24c92565dce0e06bb3b2a039e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" DROP CONSTRAINT "FK_ef209c1dcfaf4143a091de22f0c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_10d0384a816526f8c7f6b1e67b3"`,
    );
    await queryRunner.query(
      `DROP INDEX "workoudev"."IDX_13496c970093729e7ab04eb7da"`,
    );
    await queryRunner.query(
      `DROP INDEX "workoudev"."IDX_97672ac88f789774dd47f7c8be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" ADD "description" text NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."billing_type_enum_old" AS ENUM('subscription', 'extra_seat', 'extra_job', 'upgrade')`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" ALTER COLUMN "type" TYPE "workoudev"."billing_type_enum_old" USING "type"::"text"::"workoudev"."billing_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "workoudev"."billing_records_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "workoudev"."billing_type_enum_old" RENAME TO "billing_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ALTER COLUMN "matchId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "senderId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ALTER COLUMN "conversationId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidateId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "jobId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."match_decision_enum_old" AS ENUM('pending', 'approved', 'skipped')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" TYPE "workoudev"."match_decision_enum_old" USING "candidate_decision"::"text"::"workoudev"."match_decision_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "candidate_decision" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "workoudev"."matches_candidate_decision_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "workoudev"."match_decision_enum_old" RENAME TO "match_decision_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."match_decision_enum_old" AS ENUM('pending', 'approved', 'skipped')`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" TYPE "workoudev"."match_decision_enum_old" USING "recruiter_decision"::"text"::"workoudev"."match_decision_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ALTER COLUMN "recruiter_decision" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "workoudev"."matches_recruiter_decision_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "workoudev"."match_decision_enum_old" RENAME TO "match_decision_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."job_status_enum_old" AS ENUM('draft', 'open', 'paused', 'closed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "workoudev"."job_status_enum_old" USING "status"::"text"::"workoudev"."job_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'open'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."jobs_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "workoudev"."job_status_enum_old" RENAME TO "job_status_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."recruiter_role_enum_old" AS ENUM('owner', 'manager')`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ALTER COLUMN "company_role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ALTER COLUMN "company_role" TYPE "workoudev"."recruiter_role_enum_old" USING "company_role"::"text"::"workoudev"."recruiter_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ALTER COLUMN "company_role" SET DEFAULT 'manager'`,
    );
    await queryRunner.query(
      `DROP TYPE "workoudev"."recruiter_profiles_company_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "workoudev"."recruiter_role_enum_old" RENAME TO "recruiter_role_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "owner_id"`);
    await queryRunner.query(`ALTER TABLE "companies" ADD "owner_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "last_job_reset_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "last_job_reset_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "plan_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "plan_expires_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" DROP COLUMN "plan_started_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD "plan_started_at" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."plan_type_enum_old" AS ENUM('essencial', 'pro', 'business', 'enterprise')`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ALTER COLUMN "plan" TYPE "workoudev"."plan_type_enum_old" USING "plan"::"text"::"workoudev"."plan_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."companies_plan_enum"`);
    await queryRunner.query(
      `ALTER TYPE "workoudev"."plan_type_enum_old" RENAME TO "plan_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "companies" ADD CONSTRAINT "UQ_companies_document" UNIQUE ("document")`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "candidateId" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."resume_status_enum_old" AS ENUM('uploaded', 'parsed', 'failed')`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" TYPE "workoudev"."resume_status_enum_old" USING "status"::"text"::"workoudev"."resume_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ALTER COLUMN "status" SET DEFAULT 'uploaded'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."resumes_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "workoudev"."resume_status_enum_old" RENAME TO "resume_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "workoudev"."user_role_enum_old" AS ENUM('admin', 'recruiter', 'candidate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "workoudev"."user_role_enum_old" USING "role"::"text"::"workoudev"."user_role_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'candidate'`,
    );
    await queryRunner.query(`DROP TYPE "workoudev"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TYPE "workoudev"."user_role_enum_old" RENAME TO "user_role_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "createdById"`);
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" DROP COLUMN "jobs_posted_this_month"`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" DROP COLUMN "extra_jobs_allowed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "billing_records" ADD CONSTRAINT "billing_records_company_id_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversations" ADD CONSTRAINT "FK_conversations_match" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_matches_job" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_matches_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "jobs" ADD CONSTRAINT "FK_jobs_company" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_company_id_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resumes" ADD CONSTRAINT "FK_resumes_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD CONSTRAINT "FK_candidates_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
