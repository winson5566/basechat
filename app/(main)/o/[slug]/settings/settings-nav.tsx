"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { getModelSettingsPath, getPromptSettingsPath, getSettingsPath, getUserSettingsPath } from "@/lib/paths";
import { cn } from "@/lib/utils";

import { AppLocation } from "../footer";

const NavItem = ({ children, selected }: { children: ReactNode; selected?: boolean }) => (
  <div className={cn("px-3 py-2 rounded-lg", selected ? "bg-[#F5F5F7] font-semibold" : "")}>{children}</div>
);

function getAppLocation(path: string, slug: string): AppLocation {
  if (path.startsWith(getUserSettingsPath(slug))) {
    return AppLocation.SETTINGS_USERS;
  }
  if (path.startsWith(getModelSettingsPath(slug))) {
    return AppLocation.SETTINGS_MODELS;
  }
  if (path.startsWith(getPromptSettingsPath(slug))) {
    return AppLocation.SETTINGS_PROMPTS;
  }
  return AppLocation.SETTINGS;
}

interface Props {
  tenant: { slug: string };
}

export default function SettingsNav({ tenant }: Props) {
  const pathname = usePathname();
  const appLocation = getAppLocation(pathname, tenant.slug);

  return (
    <div className="w-[233px] flex flex-col pr-16">
      <Link href={getSettingsPath(tenant.slug)}>
        <NavItem selected={appLocation === AppLocation.SETTINGS}>General</NavItem>
      </Link>
      <Link href={getUserSettingsPath(tenant.slug)}>
        <NavItem selected={appLocation === AppLocation.SETTINGS_USERS}>Users</NavItem>
      </Link>
      <Link href={getModelSettingsPath(tenant.slug)}>
        <NavItem selected={appLocation === AppLocation.SETTINGS_MODELS}>Models</NavItem>
      </Link>
      <Link href={getPromptSettingsPath(tenant.slug)}>
        <NavItem selected={appLocation === AppLocation.SETTINGS_PROMPTS}>Prompts</NavItem>
      </Link>
    </div>
  );
}
