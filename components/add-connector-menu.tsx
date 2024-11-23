"use client";

import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const CONNECTOR_LIST = [
  ["confluence", "Confluence"],
  ["jira", "Jira"],
  ["gmail", "Gmail"],
  ["google_drive", "Google Drive"],
  ["notion", "Notion"],
  ["onedrive", "OneDrive"],
  ["salesforce", "Salesforce"],
]

export default function AddConnectorMenu({ className }: { className?: string }) {
  const router = useRouter();

  const onSelect = async (sourceType: string) => {
    const res = await fetch(`/api/connect/${sourceType}`)
    if (res.status < 200 || res.status >= 300) throw new Error("Could not retrieve redirect URL");
    const { url } = await res.json() as { url: string }
    router.push(url)
  }

  return <div className={className}>
    <DropdownMenu>
      <DropdownMenuTrigger className="border border-black py-1 px-2 rounded">+ Connect</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Choose a connector</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CONNECTOR_LIST.map(([sourceType, name]) => (
          <DropdownMenuItem key={sourceType} onSelect={() => onSelect(sourceType)}>{name}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
}