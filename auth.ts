import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { DefaultSession } from "next-auth";

import authConfig from "./auth.config";
import db from "./lib/db";
import * as schema from "./lib/db/schema";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** Flag indiciating whether or not the user has finished setup */
      setup: boolean;
      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    authorized: ({ auth }) => !!auth,
    jwt({ token, user, trigger }) {
      if (user) {
        token.setup = false; // TODO: Check if setup is complete
      }
      return token;
    },
  },
});
