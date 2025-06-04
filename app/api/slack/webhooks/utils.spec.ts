import { eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "@/lib/server/db/schema";
import { createTestUser, createTestTenant, initTestDb, closeTestDb, cleanupTestTenant } from "@/lib/test";

import { slackSignIn } from "./utils";

let db: NodePgDatabase<typeof schema>;

beforeAll(async () => {
  const testDbSetup = await initTestDb();
  db = testDbSetup.db;
});

afterAll(async () => {
  await closeTestDb();
});

describe("slackSignIn", () => {
  describe("when the team does NOT exist", () => {
    const slackTeamId = "does-not-exist";

    beforeEach(async () => {
      const tenant = await db.query.tenants.findFirst({
        where: eq(schema.tenants.slackTeamId, slackTeamId),
      });
      expect(tenant).toBeUndefined();
    });

    it("should throw an error", async () => {
      await expect(slackSignIn(slackTeamId, "slack-user-123")).rejects.toThrow("expected single record");
    });
  });

  describe("when the team exists", () => {
    const slackTeamId = "does-exist";
    let tenant: typeof schema.tenants.$inferSelect;

    beforeEach(async () => {
      tenant = await createTestTenant({ slackTeamId });
    });

    afterEach(async () => {
      await cleanupTestTenant(tenant.id);
    });

    // describe("when the user does NOT exist", () => {
    //   it("should create a new user", async () => {
    //     const result = await slackSignIn(slackTeamId, "slack-user-123");
    //     expect(result).toEqual({ tenant, profile: expect.any(Object) });
    //   });
    // });

    describe("when the user exists", () => {
      let existingSlackUserId = "slack-user-123";
      let user: typeof schema.users.$inferSelect;

      beforeEach(async () => {
        user = await createTestUser({ slackUserId: existingSlackUserId });
      });

      it("should return the user", async () => {
        const result = await slackSignIn(slackTeamId, existingSlackUserId);

        expect(result).toEqual({
          tenant,
          profile: expect.objectContaining({
            userId: user.id,
            tenantId: tenant.id,
            slackUserId: existingSlackUserId,
          }),
        });
      });
    });
  });
});
