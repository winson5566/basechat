// import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
// import { drizzle } from "drizzle-orm/node-postgres";

import { randomUUID } from "crypto";

import { eq } from "drizzle-orm";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "@/lib/server/db/schema";

import { changeRole, deleteProfile } from "./service";

let db: NodePgDatabase<typeof schema>;
let client: pg.Client;

beforeAll(async () => {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL! });
  await client.connect();
  db = drizzle(client);
});

afterAll(async () => {
  await client.end();
});

async function createTestTenant() {
  const id = randomUUID();
  return (
    await db
      .insert(schema.tenants)
      .values({
        name: `example-${id}`,
        slug: `example-${id}`,
        trialExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      })
      .returning()
  )[0];
}

describe("changeRole", () => {
  describe("when the last admin changes their role to user", () => {
    it("throws an error", async () => {
      const user = (await db.insert(schema.users).values({}).returning())[0];
      const tenant = await createTestTenant();
      const admin = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user.id, role: "admin" }).returning()
      )[0];

      expect(async () => {
        await changeRole(tenant.id, admin.id, "user");
      }).rejects.toThrow("Cannot change role of the last admin");
    });
  });

  describe("when the 2nd to last admin changes their role to user", () => {
    it("allows the change", async () => {
      const tenant = await createTestTenant();

      const user1 = (await db.insert(schema.users).values({}).returning())[0];
      const admin1 = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user1.id, role: "admin" }).returning()
      )[0];

      const user2 = (await db.insert(schema.users).values({}).returning())[0];
      const admin2 = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user2.id, role: "admin" }).returning()
      )[0];

      await changeRole(tenant.id, admin1.id, "user");

      const reloaded = (await db.select().from(schema.profiles).where(eq(schema.profiles.id, admin1.id)))[0];
      expect(reloaded.role).toBe("user");
    });
  });
});

describe("deleteProfile", () => {
  describe("when the last admin is deleted", () => {
    it("throws an error", async () => {
      const user = (await db.insert(schema.users).values({}).returning())[0];
      const tenant = await createTestTenant();
      const admin = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user.id, role: "admin" }).returning()
      )[0];

      expect(async () => {
        await deleteProfile({ id: admin.id, role: "admin" }, tenant.id, admin.id);
      }).rejects.toThrow("Cannot delete the last admin");
    });
  });

  describe("when the 2nd to last admin is deleted", () => {
    it("deletes the admin", async () => {
      const tenant = await createTestTenant();

      const user1 = (await db.insert(schema.users).values({}).returning())[0];
      const admin1 = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user1.id, role: "admin" }).returning()
      )[0];

      const user2 = (await db.insert(schema.users).values({}).returning())[0];
      const admin2 = (
        await db.insert(schema.profiles).values({ tenantId: tenant.id, userId: user2.id, role: "admin" }).returning()
      )[0];

      await deleteProfile({ id: admin1.id, role: "admin" }, tenant.id, admin1.id);

      const rs = await db.select().from(schema.profiles).where(eq(schema.profiles.id, admin1.id));
      expect(rs.length).toBe(0);
    });
  });
});
