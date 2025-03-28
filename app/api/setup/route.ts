import * as Minio from "minio";
import { NextRequest } from "next/server";
import { z } from "zod";

import { setupRequestSchema } from "@/lib/api";
import { createTenant, setCurrentProfileId } from "@/lib/server/service";
import { requireSession } from "@/lib/server/utils";

function createMinioClient(): Minio.Client {
  const options: Minio.ClientOptions = {
    endPoint: process.env.STORAGE_ENDPOINT!,
    useSSL: process.env.STORAGE_USE_SSL?.toLowerCase() === "true",
    accessKey: process.env.STORAGE_ACCESS_KEY!,
    secretKey: process.env.STORAGE_SECRET_KEY!,
  };

  if (process.env.STORAGE_PORT) {
    options.port = parseInt(process.env.STORAGE_PORT);
  }
  if (process.env.STORAGE_REGION) {
    options.region = process.env.STORAGE_REGION;
  }

  return new Minio.Client(options);
}

async function cleanupSetupLogo(objectName: string) {
  try {
    const minioClient = createMinioClient();
    const bucket = process.env.STORAGE_BUCKET!;
    const prefix = process.env.STORAGE_PREFIX;

    let fullObjectName = objectName;
    if (prefix) {
      fullObjectName = `${prefix}/${objectName}`;
    }

    await minioClient.removeObject(bucket, fullObjectName);
  } catch (error) {
    console.error("Failed to cleanup setup logo:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const payload = setupRequestSchema.parse(await request.json());

    const logoInfo = payload.logoUrl
      ? {
          logoUrl: payload.logoUrl,
          logoFileName: payload.logoFileName!,
          logoObjectName: payload.logoObjectName!,
        }
      : undefined;

    const { profile, tenant } = await createTenant(session.user.id, payload.name, logoInfo);
    await setCurrentProfileId(session.user.id, profile.id);

    return Response.json({ profile, tenant });
  } catch (error) {
    // If we have a logo uploaded but tenant creation failed, clean up the logo
    const payload = await request.json();
    if (payload.logoObjectName) {
      await cleanupSetupLogo(payload.logoObjectName);
    }

    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid request data", details: error.errors }, { status: 400 });
    }

    console.error("Setup error:", error);
    return Response.json({ error: "Failed to complete setup" }, { status: 500 });
  }
}
