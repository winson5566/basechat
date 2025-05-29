import { and, asc, eq } from "drizzle-orm";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";

type InsertMessage = Omit<typeof schema.messages.$inferInsert, "tenantId">;

export default class MessageDAO {
  constructor(private readonly _tenantId: string) {}

  create(message: InsertMessage) {
    return db.insert(schema.messages).values({
      ...message,
      tenantId: this._tenantId,
    });
  }

  find({ conversationId }: { conversationId: string }) {
    return db.query.messages.findMany({
      where: and(eq(schema.messages.tenantId, this._tenantId), eq(schema.messages.conversationId, conversationId)),
      orderBy: [asc(schema.messages.createdAt)],
    });
  }
}
