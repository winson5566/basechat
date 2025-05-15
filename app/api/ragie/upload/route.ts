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

    const fileMode = formData.get("file_mode") as string;
    let mode;
    if (fileMode === "audio") {
      mode = {
        static: "hi_res",
        audio: true,
        video: null,
      };
    } else if (fileMode === "video") {
      mode = {
        static: "hi_res",
        audio: null,
        video: "audio_video",
      };
    } else {
      mode = {
        static: "hi_res",
        audio: null,
        video: null,
      };
    }

    const res = await client.documents.create({
      file: file,
      partition: partition || "",
      mode: mode as any,
      metadata,
    });
    return Response.json(res);
  } catch (error) {
    console.error("Error uploading file:", JSON.stringify(error));
    return Response.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
