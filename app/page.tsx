import Chatbot from "@/components/chatbot";
import ConnectionList from "@/components/connection-list";

const COMPANY_NAME = "Company"

export default function Home() {
  return (
    <main className="flex min-h-screen p-6 pt-4">
      <ConnectionList />
      <Chatbot company={COMPANY_NAME} />
    </main>
  );
}
