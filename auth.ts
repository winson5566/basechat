import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import db from "@/lib/server/db";
import * as schema from "@/lib/server/db/schema";
import * as settings from "@/lib/server/settings";

import { hashPassword, verifyPassword } from "./lib/server/utils";

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
  advanced: { generateId: false },
  socialProviders,
  emailAndPassword: {
    enabled: true,
    // disableSignUp: false,
    // requireEmailVerification: true,
    minPasswordLength: 6,
    maxPasswordLength: 128,
    // autoSignIn: true,
    sendResetPassword: async ({ user, url, token }) => {
      // Send reset password email
    },
    // resetPasswordTokenExpiresIn: 3600, // seconds
    password: {
      hash: (password) => hashPassword(password),
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
  },
});

export default auth;
