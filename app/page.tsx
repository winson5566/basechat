import Chatbot from "@/components/chatbot";
import ConnectionList from "@/components/connection-list";
import * as settings from "@/lib/settings";

export default async function Home() {
  return (
    <main className="flex min-h-screen p-6 pt-4">
      <ConnectionList />
      <Chatbot company={settings.COMPANY_NAME} />
    </main>
  );
}
