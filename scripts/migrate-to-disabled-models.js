import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
// required for local:
// import dotenv from "dotenv";
// dotenv.config();

// run with: npm run migrate-to-disabled-models
// this will populate column disabled_models for all tenants

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is required");

const ALL_VALID_MODELS = [
  "claude-sonnet-4-20250514",
  "gpt-4o",
  "gpt-3.5-turbo",
  "gpt-4.1-2025-04-14",
  "o3-2025-04-16",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "claude-3-7-sonnet-latest",
  "claude-3-5-haiku-latest",
  "claude-opus-4-20250514",
];

const tenantsSchema = pgTable("tenants", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  enabledModels: text("enabled_models").array(),
  disabledModels: text("disabled_models").array(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).$onUpdate(() => new Date()),
});

function showUsage() {
  console.log("Usage: npm run migrate-to-disabled-models");
  process.exit(1);
}

function getDisabledModelsFromEnabled(enabledModels) {
  if (enabledModels === null) {
    return [];
  }

  return ALL_VALID_MODELS.filter((model) => !enabledModels.includes(model));
}

async function migrateToDisabledModels() {
  try {
    const allTenants = await db.select().from(tenantsSchema);
    console.log(`Found ${allTenants.length} tenants to migrate`);

    let migratedCount = 0;

    for (const tenant of allTenants) {
      try {
        const currentEnabledModels = tenant.enabledModels || [];

        const disabledModels = getDisabledModelsFromEnabled(currentEnabledModels);

        // Update the tenant with disabled_models
        await db.update(tenantsSchema).set({ disabledModels }).where(eq(tenantsSchema.id, tenant.id));

        console.log(`Migrated tenant ${tenant.slug}:`);
        console.log(`  Previous enabled models: ${currentEnabledModels.length}`);
        console.log(`  New disabled models: ${disabledModels.length}`);

        migratedCount++;
      } catch (error) {
        console.error("Migration failed for tenant", tenant.slug, error);
      }
    }

    console.log(`\nMigration completed successfully!`);
    console.log(`- Migrated: ${migratedCount} tenants`);
  } catch (error) {
    console.error("Migration failed", error);
    process.exit(1);
  }
}

if (process.argv.length > 2) {
  console.log("Error: Arguments provided");
  showUsage();
}

const db = drizzle(databaseUrl);

console.log("Migrating to disabled_models approach...");

migrateToDisabledModels()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });
