import { adminOrRedirect } from "@/lib/server/utils";

import SettingsNav from "../settings-nav";

import ModelPromptsSettings from "./model-prompts-settings";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ModelPromptsSettingsPage({ params }: Props) {
  const p = await params;
  const { tenant } = await adminOrRedirect(p.slug);

  return (
    <div className="flex justify-center overflow-auto w-full">
      <div className="max-w-[1140px] w-full p-4 flex-grow flex">
        <SettingsNav tenant={tenant} />
        <ModelPromptsSettings tenant={tenant} />
      </div>
    </div>
  );
}
