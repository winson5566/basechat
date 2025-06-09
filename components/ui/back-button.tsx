import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { Button } from "./button";

export function BackButton({
  url,
  children,
  className,
}: {
  url: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button variant="ghost" className={cn("-ml-4", className)}>
      <Link href={url} className="flex items-center">
        <ChevronLeft className="mr-2 h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}
