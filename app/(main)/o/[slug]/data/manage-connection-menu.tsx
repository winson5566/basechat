"use client";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface Props {
  id: string;
  tenant: {
    slug: string;
  };
}

export default function ManageConnectionMenu({ id, tenant }: Props) {
  const router = useRouter();

  async function deleteConnection() {
    const res = await fetch(`/api/connections/${id}`, {
      headers: { tenant: tenant.slug },
      method: "DELETE",
    });

    if (!res.ok) throw new Error("delete failed");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button>
          <MoreHorizontal />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={deleteConnection}>
          <Trash />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
