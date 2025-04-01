import { redirect } from "next/navigation";

import { getSignUpPath, getStartPath } from "@/lib/paths";
import { findUserById } from "@/lib/server/service";
import getSession from "@/lib/server/session";

export async function GET() {
  const session = await getSession();

  if (session?.user.id) {
    const user = await findUserById(session.user.id);
    if (user?.isAnonymous) {
      return redirect(getSignUpPath());
    }
  }
  return redirect(getStartPath());
}
