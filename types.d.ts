import { DefaultJWT, JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends Record<string, unknown>, DefaultJWT {
    /** Indicates whether the user has finished setup */
    setup: boolean;
  }
}
