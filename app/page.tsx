import { Inter } from "next/font/google";

import { requireSession } from "@/lib/auth-utils";
import { getTenantByUserId } from "@/lib/service";

import Main from "./main";

const inter = Inter({ subsets: ["latin"] });

export default async function Home() {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  return (
    <div className={`h-full w-full flex flex-col items-center bg-white ${inter.className}`}>
      <Main name={session.user.name} company={tenant.name} />
    </div>
  );
}
