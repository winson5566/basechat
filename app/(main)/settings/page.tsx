import { adminOrRedirect } from "@/lib/server/utils";

import GeneralSettings from "./general-settings";
import SettingsNav from "./settings-nav";

export default async function SettingsIndexPage() {
  const { tenant } = await adminOrRedirect();

  return (
    <div className="max-w-[1140px] w-full p-4 flex-grow flex">
      <SettingsNav />
      <GeneralSettings tenant={tenant} />
    </div>
  );
}
