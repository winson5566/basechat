import { requireSession } from "@/lib/server/utils";

import EmptyForm from "./empty-form";

export default async function EmptyPage() {
  const session = await requireSession();
  return (
    <main className={`flex flex-col min-h-screen p-6 pt-4 justify-center items-center bg-white`}>
      <div className="w-[800px]">
        <EmptyForm />
      </div>
    </main>
  );
}
