import crypto from "crypto";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { Ragie } from "ragie";

// run with: npm run update-partition-limit <slug> <newLimit>
// <slug> is the tenant identifier
// <newLimit> is the new pages processed limit (e.g. 20000)
const databaseUrl = process.env.DATABASE_URL;
const RAGIE_API_BASE_URL = process.env.RAGIE_API_BASE_URL;
const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY environment variable is required");
if (!databaseUrl) throw new Error("DATABASE_URL environment variable is required");
if (!RAGIE_API_BASE_URL) throw new Error("RAGIE_API_BASE_URL environment variable is required");
if (!RAGIE_API_KEY) throw new Error("RAGIE_API_KEY environment variable is required");

function decrypt(cipherText) {
  if (!cipherText) {
    throw new Error("Cipher text cannot be empty");
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = cipherText.split(":");

    if (!ivHex || !authTagHex || !encryptedHex) {
      throw new Error("Invalid cipher text format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    // Create decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error) {
    throw new Error(`Failed to decrypt cipher text: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function showUsage() {
  console.log("Usage: npm run update-partition-limit <slug> <newLimit>");
  console.log("  slug     - The tenant slug to update");
  console.log("  newLimit - The new pages processed limit (e.g. 20000)");
  process.exit(1);
}

if (process.argv.length < 4) {
  console.log("Error: Not enough arguments provided");
  showUsage();
}

const db = drizzle(databaseUrl);

const slug = process.argv[2];
const newLimit = parseInt(process.argv[3], 10);

if (isNaN(newLimit)) {
  console.log("Error: newLimit must be a number");
  showUsage();
}

const tenantsSchema = pgTable("tenants", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull(),
  ragieApiKey: text("ragie_api_key"),
  ragiePartition: text("ragie_partition"),
  partitionLimitExceededAt: timestamp("partition_limit_exceeded_at", { withTimezone: true, mode: "date" }),
});

console.log(`Updating partition limit for tenant ${slug} and setting new limit to ${newLimit}`);

async function updatePartitionLimit(slug, newLimit) {
  try {
    // First get the tenant's API key and partition
    const [tenant] = await db
      .select({
        id: tenantsSchema.id,
        ragieApiKey: tenantsSchema.ragieApiKey,
        ragiePartition: tenantsSchema.ragiePartition,
      })
      .from(tenantsSchema)
      .where(eq(tenantsSchema.slug, slug));

    if (!tenant) {
      throw new Error(`Tenant not found: ${slug}`);
    }

    // Get the Ragie client
    let client;
    let partition;
    if (tenant.ragieApiKey) {
      const decryptedApiKey = decrypt(tenant.ragieApiKey);
      client = new Ragie({
        auth: decryptedApiKey,
        serverURL: RAGIE_API_BASE_URL,
      });
      partition = tenant.ragiePartition || "default";
    } else {
      client = new Ragie({
        auth: RAGIE_API_KEY,
        serverURL: RAGIE_API_BASE_URL,
      });
      partition = tenant.id;
    }

    await client.partitions.setLimits({
      partitionId: partition,
      partitionLimitParams: {
        pagesProcessedLimitMax: newLimit,
      },
    });

    // Update the tenant record to update the exceeded flag
    await db
      .update(tenantsSchema)
      .set({
        partitionLimitExceededAt: null,
      })
      .where(eq(tenantsSchema.slug, slug));

    console.log(`Successfully updated partition limit for tenant ${slug} and set new limit to ${newLimit}`);
  } catch (error) {
    console.error("Failed to update partition limit:", error);
    process.exit(1);
  }
}

updatePartitionLimit(slug, newLimit)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to update partition limit:", error);
    process.exit(1);
  });
