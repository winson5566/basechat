import { NextRequest } from "next/server";

import { getRagieClientAndPartition } from "@/lib/server/ragie";
import { requireAdminContextFromRequest } from "@/lib/server/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { tenant } = await requireAdminContextFromRequest(request);
    const { client, partition } = await getRagieClientAndPartition(tenant.id);

    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const metadata = JSON.parse(formData.get("metadata") as string);
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const mode = {
      static: "hi_res",
      audio: true,
      video: "audio_video",
    };

    const res = await client.documents.create({
      file: file,
      partition,
      mode,
      metadata,
    });

    /**
     * SDK throws error:
     * Error uploading file: {"data$":{"detail":"Exceeded page processing limit for this partition. If this error is unexpected contact us at support@ragie.ai."},"detail":"Exceeded page processing limit for this partition. If this error is unexpected contact us at support@ragie.ai.","name":"ErrorMessage"}
     */

    return Response.json(res);
  } catch (error) {
    console.error("Error uploading file:", JSON.stringify(error));
    if (error instanceof Error && error.message.includes("limit for this partition")) {
      return Response.json({ error: error.message }, { status: 402 });
    }
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
