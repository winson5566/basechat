"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Trash } from "lucide-react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

export default function ManageConnectionMenu({ id }: { id: string }) {
  const router = useRouter();

  async function deleteConnection() {
    const res = await fetch(`/api/connections/${id}`, { method: "DELETE" });
    if (res.status < 200 || res.status >= 300) {
      throw new Error("delete failed");
    }
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={inter.className}>
        <DropdownMenuItem onSelect={deleteConnection}>
          <Trash />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
