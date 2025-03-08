"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface Props {
  name: string;
  url?: string | null;
  className?: string;
}

export default function Logo({ name, url, className }: Props) {
  const formattedName = getInitials(name);

  if (!url) {
    return (
      <div
        className={cn("avatar rounded text-white flex items-center justify-center font-bold text-[32px]", className)}
        style={{ height: 100, width: 100 }}
      >
        {formattedName}
      </div>
    );
  }

  return <img src={url} className={cn("rounded", className)} height={100} width={100} />;
}
