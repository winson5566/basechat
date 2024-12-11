import { AppLocation } from "@/app/(main)/footer";
import Main from "@/app/(main)/main";
import { requireSession } from "@/lib/auth-utils";

import Conversation from "./conversation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  return (
    <Main name={session.user.name} appLocation={AppLocation.CHAT}>
      <Conversation id={id} />
    </Main>
  );
}
