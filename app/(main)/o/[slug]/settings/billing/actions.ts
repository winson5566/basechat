"use server";

import { previewSeatChange } from "@/lib/orb";
import { getExistingMetadata } from "@/lib/server/billing";

export async function getSeatChangePreview(tenantId: string, nextCount: number) {
  try {
    const metadata = await getExistingMetadata(tenantId);
    const orbCustomerId = metadata.orbCustomerId;
    if (!orbCustomerId) {
      throw new Error("No Orb customer ID found");
    }
    return await previewSeatChange(tenantId, orbCustomerId, nextCount);
  } catch (error) {
    console.error("Error in getSeatChangePreview:", error);
    throw new Error("Failed to get seat change preview");
  }
}
