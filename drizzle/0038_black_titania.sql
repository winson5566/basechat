ALTER TABLE "tenants" ALTER COLUMN "trial_ends_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "paid_status" SET DEFAULT 'trial';