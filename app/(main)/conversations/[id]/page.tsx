import { AppLocation } from "@/app/(main)/footer";
import Main from "@/app/(main)/main";
import { requireSession } from "@/lib/server-utils";
import { getTenantByUserId } from "@/lib/service";

import Conversation from "./conversation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);
  const { id } = await params;

  return (
    <Main name={session.user.name} appLocation={AppLocation.CHAT}>
      <Conversation tenantName={tenant.name} id={id} />
    </Main>
  );
}
