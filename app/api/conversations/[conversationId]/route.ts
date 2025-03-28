import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import db from "@/lib/server/db";
import { conversations } from "@/lib/server/db/schema";
import { requireAuthContextFromRequest } from "@/lib/server/utils";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { profile, tenant } = await requireAuthContextFromRequest(request);

    // Delete the conversation
    await db.delete(conversations).where(eq(conversations.id, params.id));

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
