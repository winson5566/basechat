ALTER TABLE "tenants" ALTER COLUMN "trial_expires_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "paid_status" SET DEFAULT 'trial';