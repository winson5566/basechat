import AddConnectorMenu from "@/components/add-connector-menu";
import Chatbot from "@/components/chatbot";

const COMPANY_NAME = "Company"

export default function Home() {
  return (
    <main className="flex min-h-screen p-6 pt-4">
      <div className="flex flex-col min-w-60 mr-4 mt-9 rounded-xl p-4 bg-white">
        <div className="font-semibold">Connections</div>
        <AddConnectorMenu className="flex-grow flex items-center justify-center" />
      </div>
      <Chatbot company={COMPANY_NAME} />
    </main>
  );
}
