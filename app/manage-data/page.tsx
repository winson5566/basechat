import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { Inter } from "next/font/google";
import Image from "next/image";

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { requireSession } from "@/lib/auth-utils";
import { cn } from "@/lib/utils";

import ChatIcon from "../../public/icons/chat.svg";
import ConfluenceIconSVG from "../../public/icons/connectors/confluence.svg";
import GmailIconSVG from "../../public/icons/connectors/gmail.svg";
import GoogleDriveIconSVG from "../../public/icons/connectors/google-drive.svg";
import JiraIconSVG from "../../public/icons/connectors/jira.svg";
import NotionIconSVG from "../../public/icons/connectors/notion.svg";
import OnedriveIconSVG from "../../public/icons/connectors/onedrive.svg";
import SalesforceIconSVG from "../../public/icons/connectors/salesforce.svg";
import SlackIconSVG from "../../public/icons/connectors/slack.svg";
import DataIcon from "../../public/icons/data.svg";
import HamburgerIcon from "../../public/icons/hamburger.svg";
import NewChatIcon from "../../public/icons/new-chat.svg";
import SettingsIcon from "../../public/icons/settings.svg";
import ManageDataPreviewIcons from "../../public/manage-data-preview-icons.svg";

const inter = Inter({ subsets: ["latin"] });

const CONNECTOR_LIST = [
  ["confluence", "Confluence", ConfluenceIconSVG],
  ["jira", "Jira", JiraIconSVG],
  ["gmail", "Gmail", GmailIconSVG],
  ["google_drive", "Google Drive", GoogleDriveIconSVG],
  ["notion", "Notion", NotionIconSVG],
  ["onedrive", "OneDrive", OnedriveIconSVG],
  ["salesforce", "Salesforce", SalesforceIconSVG],
  ["slack", "Slack", SlackIconSVG],
];

function NavButton({ alt, src, className }: { alt: string; src: any; className?: string }) {
  return (
    <div className={cn("flex flex-col w-20 text-white items-center", className)}>
      <Image alt={alt} src={src} className="mb-2.5" />
      <div className="text-[14px]">{alt}</div>
    </div>
  );
}

export default async function ManageDataPage() {
  const session = await requireSession();

  return (
    <div className={`min-h-screen flex flex-col items-center bg-white ${inter.className}`}>
      <header className="w-full flex justify-between p-4 items-center">
        <div className="flex">
          <Image src={HamburgerIcon} alt="Expand chats" className="mr-2.5" />
          <Image src={NewChatIcon} alt="New chat" />
        </div>
        <div className="bg-[#66666E] rounded-[16px] h-[32px] w-[32px] flex items-center justify-center text-[#FEFEFE] font-semibold">
          {session.user.name?.trim()[0].toUpperCase()}
        </div>
      </header>
      <div className="flex-grow h-full w-full flex flex-col items-center justify-center max-w-[1140px] p-4">
        <div className="flex w-full justify-between items-center pt-2">
          <h1 className="font-bold text-[32px]">Manage data</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center rounded-[40px] h-[40px] px-5 bg-[#F5F5F7] border border-[#D7D7D7] font-semibold">
                <div className="mr-2">Add Data</div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask
                    id="mask0_217_2334"
                    style={{ maskType: "alpha" }}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="16"
                    height="16"
                  >
                    <rect y="16" width="16" height="16" transform="rotate(-90 0 16)" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#mask0_217_2334)">
                    <path
                      d="M12 6.3999L8 10.3999L4 6.3999L4.85 5.5499L8 8.6999L11.15 5.5499L12 6.3999Z"
                      fill="#1C1B1F"
                    />
                  </g>
                </svg>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[#F5F5F7] border border-[#D7D7D7] py-4 px-2.5 rounded-[24px] mt-4"
            >
              {CONNECTOR_LIST.map(([sourceType, name, icon]) => (
                <DropdownMenuItem key={sourceType} className="w-[190px] h-[35px] flex items-center mb-2 px-2">
                  <Image src={icon} alt={name} className="mr-3" />
                  <div>{name}</div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex-grow w-full flex flex-col items-center justify-center">
          <Image alt="Manage data" src={ManageDataPreviewIcons} />
          <h1 className="font-bold text-[32px] mb-3">Chat with your own data</h1>
          <div className="text-[16px]">Click ‘Add data’ above to get started</div>
        </div>
      </div>
      <div className="h-20 w-full bg-[#27272A] flex items-center justify-center">
        <div className="flex">
          <NavButton alt="Chat" src={ChatIcon} className="mr-5" />
          <NavButton alt="My Data" src={DataIcon} className="mr-5 font-semibold" />
          <NavButton alt="Settings" src={SettingsIcon} />
        </div>
      </div>
    </div>
  );
}
