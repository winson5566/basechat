import { eq } from "drizzle-orm";

import db from "./db";
import * as schema from "./db/schema";
import { getRagieConnection } from "./ragie";

export async function saveConnection(id: string, status: string) {
  const qs = await db.select().from(schema.connections).where(eq(schema.connections.connectionId, id)).for("update");
  const connection = qs.length === 1 ? qs[0] : null;

  if (!connection) {
    const ragieConnection = await getRagieConnection(id);
    await db.insert(schema.connections).values({
      connectionId: id,
      name: ragieConnection.source_display_name,
      status,
    });
  } else {
    await db.update(schema.connections).set({ status }).where(eq(schema.connections.connectionId, id));
  }
}
