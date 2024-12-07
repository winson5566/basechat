import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [Google],
  callbacks: {
    session({ session, user, token }) {
      session.user.id = token.id;
      session.user.setup = token.setup;
      return session;
    },
  },
} satisfies NextAuthConfig;
