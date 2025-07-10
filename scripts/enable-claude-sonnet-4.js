import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// run with: npm run enable-claude-sonnet-4
// This script enables the claude-sonnet-4-20250514 model for all tenants
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) throw new Error("DATABASE_URL environment variable is required");

const NEW_MODEL = "claude-sonnet-4-20250514";

const tenantsSchema = pgTable("tenants", {
  id: uuid("id").primaryKey(),
  slug: text("slug").notNull(),
  enabledModels: text("enabled_models").array(),
  defaultModel: text("default_model"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

console.log(`Starting to enable ${NEW_MODEL} for all tenants...`);

async function enableClaudeSonnet4ForAllTenants() {
  const db = drizzle(databaseUrl);

  try {
    // Get all tenants
    console.log("Fetching all tenants from database...");
    const tenants = await db
      .select({
        id: tenantsSchema.id,
        slug: tenantsSchema.slug,
        enabledModels: tenantsSchema.enabledModels,
        defaultModel: tenantsSchema.defaultModel,
      })
      .from(tenantsSchema);

    console.log(`Found ${tenants.length} tenants to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      try {
        console.log(`\nProcessing tenant: ${tenant.slug} (${tenant.id})`);

        // Check if the new model is already enabled and if default model needs updating
        const currentEnabledModels = tenant.enabledModels || [];
        const hasNewModel = currentEnabledModels.includes(NEW_MODEL);
        const currentDefaultModel = tenant.defaultModel;
        const needsDefaultModelUpdate = currentDefaultModel !== NEW_MODEL;

        // Determine what needs to be updated
        let updatedEnabledModels = currentEnabledModels;
        let enabledModelsChanged = false;

        if (!hasNewModel) {
          // Add the new model to enabled models
          updatedEnabledModels = [...currentEnabledModels, NEW_MODEL];
          enabledModelsChanged = true;
        }

        // Update the tenant (always update default model, conditionally update enabled models)
        const updateData = {
          defaultModel: NEW_MODEL,
        };

        if (enabledModelsChanged) {
          updateData.enabledModels = updatedEnabledModels;
        }

        await db.update(tenantsSchema).set(updateData).where(eq(tenantsSchema.id, tenant.id));

        // Log the changes
        if (hasNewModel && !needsDefaultModelUpdate) {
          console.log(`  ✓ ${NEW_MODEL} already enabled and set as default, skipping...`);
          skippedCount++;
        } else {
          console.log(`  ✓ Successfully updated tenant`);
          if (enabledModelsChanged) {
            console.log(`    ✓ Added ${NEW_MODEL} to enabled models`);
            console.log(
              `    Previous enabled models: ${currentEnabledModels.length > 0 ? currentEnabledModels.join(", ") : "none"}`,
            );
            console.log(`    New enabled models: ${updatedEnabledModels.join(", ")}`);
          } else {
            console.log(`    ✓ ${NEW_MODEL} already in enabled models`);
          }

          if (needsDefaultModelUpdate) {
            console.log(`    ✓ Updated default model from "${currentDefaultModel || "none"}" to "${NEW_MODEL}"`);
          } else {
            console.log(`    ✓ Default model already set to ${NEW_MODEL}`);
          }

          updatedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error processing tenant ${tenant.slug}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("SCRIPT COMPLETION SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total tenants processed: ${tenants.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Skipped (already enabled): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);

    if (errorCount > 0) {
      console.log(`\n⚠️  ${errorCount} tenant(s) had errors. Check the logs above for details.`);
      process.exit(1);
    } else {
      console.log(`\n✅ Successfully enabled ${NEW_MODEL} for all tenants!`);
    }
  } catch (error) {
    console.error("Failed to enable Claude Sonnet 4 for tenants:", error);
    process.exit(1);
  }
}

enableClaudeSonnet4ForAllTenants()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
