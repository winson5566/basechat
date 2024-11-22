import Chatbot from "@/components/chatbot";

const COMPANY_NAME = "Company"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F4F4F5]">
      <Chatbot company={COMPANY_NAME} />
    </div>
  );
}
