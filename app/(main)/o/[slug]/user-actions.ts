"use server";

import { eq } from "drizzle-orm";

import db from "@/lib/server/db";
import { users } from "@/lib/server/db/schema";

export async function updateCompletedWelcomeFlow(userId: string) {
  try {
    await db
      .update(users)
      .set({
        completedWelcomeFlowAt: new Date(),
      })
      .where(eq(users.id, userId));

    return { success: true };
  } catch (error) {
    console.error("Failed to update welcome flow completion:", error);
    throw error;
  }
}
