import Chatbot from "@/components/chatbot";

const COMPANY_NAME = "Company"

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <Chatbot company={COMPANY_NAME} />
    </main>
  );
}
