import { eq } from "drizzle-orm";

import db from "@/lib/server/db";
import { tenants } from "@/lib/server/db/schema";
import { encryptApiKey } from "@/lib/server/encryption";

async function updateRagieApiKey(tenantId: string, apiKey: string, partition?: string) {
  try {
    // Encrypt the API key
    const encryptedApiKey = encryptApiKey(apiKey);

    // Update the tenant record
    await db
      .update(tenants)
      .set({
        ragieApiKey: encryptedApiKey,
        ragiePartition: partition || null,
      })
      .where(eq(tenants.id, tenantId));

    console.log(`Successfully updated Ragie API key for tenant ${tenantId}`);
  } catch (error) {
    console.error("Failed to update Ragie API key:", error);
    process.exit(1);
  }
}

// Check if we have the required arguments
if (process.argv.length < 4) {
  console.error("Usage: ts-node scripts/update-ragie-api-key.ts <tenantId> <apiKey> [partition]");
  process.exit(1);
}

const tenantId = process.argv[2];
const apiKey = process.argv[3];
const partition = process.argv[4];

updateRagieApiKey(tenantId, apiKey, partition);
