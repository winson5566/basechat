"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface Props {
  name: string;
  url?: string | null;
  className?: string;
  width: number;
  height: number;
}

export default function Logo({ name, url, width, height, className }: Props) {
  const formattedName = getInitials(name);

  if (!url) {
    return (
      <div
        className={cn("avatar rounded text-white flex items-center justify-center font-bold text-[32px]", className)}
        style={{ height, width }}
      >
        {formattedName}
      </div>
    );
  }

  return <img src={url} className={cn("rounded", className)} height={height} width={width} />;
}
