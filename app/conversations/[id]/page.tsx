import { AppLocation } from "@/app/footer";
import Main from "@/app/main";
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
