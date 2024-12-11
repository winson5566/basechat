import { requireSession } from "@/lib/auth-utils";
import { getTenantByUserId } from "@/lib/service";

import Main from "./main";
import Welcome from "./welcome";

export default async function Home() {
  const session = await requireSession();
  const tenant = await getTenantByUserId(session.user.id);

  return (
    <div className="h-full w-full flex flex-col items-center bg-white">
      <Main name={session.user.name}>
        <Welcome company={tenant.name} className="flex-grow flex flex-col w-full bg-white p-4 max-w-[717px]" />
      </Main>
    </div>
  );
}
