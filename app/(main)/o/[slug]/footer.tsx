"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getDataPath, getPublishPath, getSettingsPath, getTenantPath } from "@/lib/paths";
import { cn } from "@/lib/utils";
import ChatIconOff from "@/public/icons/chat-off.svg";
import ChatIconOn from "@/public/icons/chat-on.svg";
import DataIconOff from "@/public/icons/data-off.svg";
import DataIconOn from "@/public/icons/data-on.svg";
import PublishIconOff from "@/public/icons/publish-off.svg";
import PublishIconOn from "@/public/icons/publish-on.svg";
import SettingsIconOff from "@/public/icons/settings-off.svg";
import SettingsIconOn from "@/public/icons/settings-on.svg";

export enum AppLocation {
  CHAT,
  DATA,
  PUBLISH,
  SETTINGS,
  SETTINGS_USERS,
  SETTINGS_MODELS,
  SETTINGS_PROMPTS,
  SETTINGS_SLACK,
  SETTINGS_BILLING,
}

export function NavButton({ alt, src, className }: { alt: string; src: any; className?: string }) {
  return (
    <div className={cn("flex flex-col w-20 text-white items-center", className)}>
      <Image alt={alt} src={src} className="mb-2.5" />
      <div className="text-[14px]">{alt}</div>
    </div>
  );
}

interface Props {
  className?: string;
  tenant: { slug: string };
}

export default function Footer({ className, tenant }: Props) {
  const pathname = usePathname();

  let appLocation = AppLocation.CHAT;
  if (pathname.startsWith(getDataPath(tenant.slug))) {
    appLocation = AppLocation.DATA;
  } else if (pathname.startsWith(getPublishPath(tenant.slug))) {
    appLocation = AppLocation.PUBLISH;
  } else if (pathname.startsWith(getSettingsPath(tenant.slug))) {
    appLocation = AppLocation.SETTINGS;
  }

  const chatIcon = appLocation === AppLocation.CHAT ? ChatIconOn : ChatIconOff;
  const chatClassName = appLocation === AppLocation.CHAT ? "mr-5 font-semibold" : "mr-5";

  const dataIcon = appLocation === AppLocation.DATA ? DataIconOn : DataIconOff;
  const dataClassName = appLocation === AppLocation.DATA ? "mr-5 font-semibold" : "mr-5";

  const publishIcon = appLocation === AppLocation.PUBLISH ? PublishIconOn : PublishIconOff;
  const publishClassName = appLocation === AppLocation.PUBLISH ? "mr-5 font-semibold" : "mr-5";

  const settingsIcon = appLocation === AppLocation.SETTINGS ? SettingsIconOn : SettingsIconOff;
  const settingsClassName = appLocation === AppLocation.SETTINGS ? "mr-5 font-semibold" : "mr-5";

  return (
    <div className={className}>
      <div className="flex">
        <Link href={getTenantPath(tenant.slug)}>
          <NavButton alt="Chat" src={chatIcon} className={chatClassName} />
        </Link>
        <Link href={getDataPath(tenant.slug)}>
          <NavButton alt="Data" src={dataIcon} className={dataClassName} />
        </Link>
        <Link href={getPublishPath(tenant.slug)}>
          <NavButton alt="Publish" src={publishIcon} className={publishClassName} />
        </Link>
        <Link href={getSettingsPath(tenant.slug)}>
          <NavButton alt="Settings" src={settingsIcon} className={settingsClassName} />
        </Link>
      </div>
    </div>
  );
}
