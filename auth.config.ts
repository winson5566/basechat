import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [Google],
  callbacks: {
    session({ session, token }) {
      session.user.setup = token.setup;
      return session;
    },
  },
} satisfies NextAuthConfig;
