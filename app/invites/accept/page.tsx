import assert from "assert";

import Image from "next/image";
import { redirect } from "next/navigation";

import WinsonWuLogo from "@/components/winsonwu-logo";
import { getTenantPath } from "@/lib/paths";
import {
  acceptInvite,
  findInviteById,
  setCurrentProfileId,
  findUserById,
  getTenantsByUserId,
} from "@/lib/server/service";
import * as settings from "@/lib/server/settings";
import { requireSession } from "@/lib/server/utils";

interface Props {
  searchParams: Promise<{ invite?: string }>;
}

function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="h-screen w-full flex flex-col items-center bg-white overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto">
        <div className="w-full max-w-[442px] px-4 pt-10 mx-auto h-full flex flex-col items-center justify-center max-[460px]:px-8">
          <div className="flex items-center mb-16 w-full max-[460px]:justify-start max-[460px]:mr-6">
            <Image
              src="/images/title-logo.svg"
              alt={settings.APP_NAME}
              width={410}
              height={64}
              className="max-w-[410px] max-h-[64px] max-[460px]:max-w-[185px] max-[460px]:max-h-[24px]"
              priority
            />
          </div>
          <div className="flex flex-col items-center w-full">
            <div className="self-start text-[24px] font-bold mb-12">{title}</div>
            <div className="text-red-500 text-center mb-4">{message}</div>
          </div>
        </div>
      </div>
      <div className="h-20 shrink-0 w-full bg-[#27272A] flex items-center justify-center">
        <div className="mr-2.5 text-md text-[#FEFEFE]">Powered by</div>
        <div>
          <a href="https://winsonwu.com/?utm_source=smart-chat" target="_blank">
            <WinsonWuLogo />
          </a>
        </div>
      </div>
    </div>
  );
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const session = await requireSession();
  const params = await searchParams;

  assert(params.invite, "Bad request");

  // Handle invalid UUID format gracefully
  let invite;
  try {
    invite = await findInviteById(params.invite);
  } catch (error) {
    // This will catch database errors from invalid UUID format
    console.error("Error finding invite:", error);
    return <ErrorPage title="Invalid Invite Link" message="Invalid invite ID. Please check the link and try again." />;
  }

  if (!invite) {
    return <ErrorPage title="Invalid Invite" message="Could not find invite. Please check the link and try again." />;
  }

  try {
    const profile = await acceptInvite(session.user.id, params.invite);
    await setCurrentProfileId(session.user.id, profile.id);

    // Fetch the updated user data to get the new currentProfileId
    const updatedUser = await findUserById(session.user.id);
    assert(updatedUser, "User not found after profile update");

    const tenants = await getTenantsByUserId(session.user.id);
    const newTenant = tenants.find((t) => t.id === profile.tenantId);

    if (!newTenant) {
      return <ErrorPage title="Error" message="Could not find tenant information. Please try again." />;
    }

    // Redirect directly to the new tenant
    redirect(getTenantPath(newTenant.slug));
  } catch (e) {
    // NEXT_REDIRECT is thrown by redirect("/") and should be rethrown
    if (e instanceof Error && e.message === "NEXT_REDIRECT") {
      throw e;
    } else {
      // some other error occurred
      console.error("Error accepting invite:", e);
    }
  }

  return (
    <ErrorPage
      title="Error Processing Invite"
      message="Could not process invite. Please try again or contact support."
    />
  );
}
