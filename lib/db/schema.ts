import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

export const connections = pgTable("connections", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  connectionId: text("connection_id").notNull().unique(),
  name: text().notNull(),
  status: text().notNull(),
});
