import { requireSession } from "@/lib/auth-utils";
import { getTenantByUserId } from "@/lib/service";

import Main from "./main";

export default async function Home() {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  return (
    <div className={`h-full w-full flex flex-col items-center bg-white`}>
      <Main name={session.user.name} company={tenant.name} />
    </div>
  );
}
