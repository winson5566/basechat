import Main from "@/app/main";
import { requireSession } from "@/lib/auth-utils";

import Conversation from "./conversation";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  return (
    <div className="h-full w-full flex flex-col items-center bg-white">
      <Main name={session.user.name}>
        <Conversation id={id} />
      </Main>
    </div>
  );
}
