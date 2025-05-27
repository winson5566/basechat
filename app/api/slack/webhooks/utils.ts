import { auth } from "@/auth";
import {
  createProfile,
  findProfileByTenantIdAndUserId,
  findUserById,
  findUserBySlackUserId,
  getTenantBySlackTeamId,
} from "@/lib/server/service";

// TODO: Clean this up and add tests
export async function slackSignIn(teamId: string, slackUserId: string) {
  const tenant = await getTenantBySlackTeamId(teamId);
  let user = await findUserBySlackUserId(slackUserId);
  if (!user) {
    const data = await auth.api.signInAnonymous();
    if (!data) {
      throw new Error("Could not sign in");
    }
    user = await findUserById(data.user.id);
    if (!user) {
      throw new Error("Could not find user");
    }
  }
  let profile = await findProfileByTenantIdAndUserId(tenant.id, user!.id);
  if (!profile) {
    profile = await createProfile(tenant.id, user.id, "guest");
  }
  return { tenant, profile };
}
