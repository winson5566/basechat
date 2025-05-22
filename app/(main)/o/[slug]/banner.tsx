import Link from "next/link";

import { cn } from "@/lib/utils";

interface BannerProps {
  className?: string;
  children: React.ReactNode;
  bubble?: boolean;
}

export function Banner({ className, children, bubble = false }: BannerProps) {
  return (
    <div
      className={cn(
        "min-w-[560px] h-[32px] rounded-[208px] bg-[#F5F5F7] flex items-center whitespace-nowrap",
        bubble ? "pl-1 pr-4" : "px-4 justify-center",
        className,
      )}
    >
      {bubble && (
        <div className="w-[82px] h-[25px] rounded-[32px] bg-gradient-to-r from-[#F5C3AF] via-[#EA89D7] to-[#6767D9] flex items-center justify-center text-white text-sm font-medium mr-2 flex-shrink-0">
          Free Trial
        </div>
      )}
      <div className="text-black text-[14px] font-medium leading-[20px]">{children}</div>
    </div>
  );
}

export function BannerLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} target="_blank" className="text-[#D946EF] underline hover:text-[#D946EF]/90">
      {children}
    </Link>
  );
}
