import { and, eq } from "drizzle-orm";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";

export default class MessageDAO {
  constructor(private readonly _tenantId: string) {}

  find({ conversationId }: { conversationId: string }) {
    return db.query.messages.findMany({
      where: and(eq(schema.messages.tenantId, this._tenantId), eq(schema.messages.conversationId, conversationId)),
    });
  }
}
