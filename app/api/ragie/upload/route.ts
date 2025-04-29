import { NextRequest } from "next/server";
import { z } from "zod";

import { decrypt } from "@/lib/server/encryption";
import { getRagieClientAndPartition, getRagieSettingsByTenantId } from "@/lib/server/ragie";
import { saveFile } from "@/lib/server/service";
import { RAGIE_API_BASE_URL, RAGIE_API_KEY } from "@/lib/server/settings";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAdminContextFromRequest(request);
    const { client, partition } = await getRagieClientAndPartition(tenant.id);
    const { ragieApiKey: encryptedApiKey } = await getRagieSettingsByTenantId(tenant.id);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    let token = RAGIE_API_KEY;
    if (encryptedApiKey) {
      token = decrypt(encryptedApiKey);
    }

    // Create a new FormData for Ragie
    const ragieFormData = new FormData();
    ragieFormData.append("file", file);
    ragieFormData.append("partition", partition || "");
    ragieFormData.append("mode", "hi_res"); // because we use hi_res when we create a connection

    // Upload the file to Ragie
    const response = await fetch(`${RAGIE_API_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
      body: ragieFormData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const document = await response.json();

    // Save the connection in our database
    // TODO: update sync status with webhooks when document is ready
    await saveFile(tenant.id, document.id, document.status);

    return Response.json(document);
  } catch (error) {
    console.error("Error uploading file:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
