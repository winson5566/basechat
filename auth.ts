import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import * as settings from "@/lib/server/settings";

const socialProviders: Record<string, unknown> = {};

if (settings.AUTH_GOOGLE_ID && settings.AUTH_GOOGLE_SECRET) {
  socialProviders.google = {
    clientId: settings.AUTH_GOOGLE_ID,
    clientSecret: settings.AUTH_GOOGLE_SECRET,
  };
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  socialProviders,
});

export default auth;
