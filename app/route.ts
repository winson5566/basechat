import { redirect } from "next/navigation";

import { getSignUpPath, getStartPath } from "@/lib/paths";
import auth from "@/lib/server/auth";
import { findUserById } from "@/lib/server/service";

export async function GET() {
  const session = await auth();

  if (session?.user.id) {
    const user = await findUserById(session.user.id);
    if (user?.isAnonymous) {
      return redirect(getSignUpPath());
    }
  }
  return redirect(getStartPath());
}
