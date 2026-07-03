-- Add tracking columns to recruiter_profiles
ALTER TABLE recruiter_profiles
ADD COLUMN IF NOT EXISTS extra_jobs_allowed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS jobs_posted_this_month INT DEFAULT 0;

-- Add createdBy reference to jobs
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS "createdById" UUID REFERENCES recruiter_profiles(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_created_by ON jobs("createdById");
