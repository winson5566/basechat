"use client";

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Trash } from "lucide-react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const inter = Inter({ subsets: ["latin"] });

interface Props {
  id: string;
  tenant: {
    slug: string;
  };
}

export default function ManageFileMenu({ id, tenant }: Props) {
  const router = useRouter();

  async function deleteFile() {
    const res = await fetch(`/api/documents/${id}`, {
      headers: { tenant: tenant.slug },
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete file");
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
        <DropdownMenuItem onSelect={deleteFile}>
          <Trash />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
