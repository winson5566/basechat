import { NextRequest } from "next/server";
import { z } from "zod";

import { getRagieClientAndPartition } from "@/lib/server/ragie";
import { saveConnection } from "@/lib/server/service";
import { RAGIE_API_BASE_URL, RAGIE_API_KEY } from "@/lib/server/settings";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAdminContextFromRequest(request);
    const { client, partition } = await getRagieClientAndPartition(tenant.id);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Create a new FormData for Ragie
    const ragieFormData = new FormData();
    ragieFormData.append("file", file);
    ragieFormData.append("partition", partition || "");

    // Upload the file to Ragie
    const response = await fetch(`${RAGIE_API_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "multipart/form-data",
        authorization: `Bearer ${RAGIE_API_KEY}`, //TODO: get the tenant's encrypted api key if they have one, need to decrypt
      },
      body: ragieFormData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const document = await response.json();

    // Save the connection in our database
    // TODO: i don't think we need to do this
    await saveConnection(tenant.id, document.id, "ready");

    return Response.json(document);
  } catch (error) {
    console.error("Error uploading file:", error);
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
