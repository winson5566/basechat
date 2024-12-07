import assert from "assert";

import { auth } from "@/auth";

export async function requireSession() {
  const session = await auth();
  assert(session, "not logged in");
  return session;
}
