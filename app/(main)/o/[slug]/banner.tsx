import { cn } from "@/lib/utils";

interface BannerProps {
  className?: string;
  children: React.ReactNode;
}

export function Banner({ className, children }: BannerProps) {
  return (
    <div
      className={cn("w-[654px] h-[32px] rounded-[208px] bg-[#F5F5F7] flex items-center px-[6px] pr-[20px]", className)}
    >
      <div className="w-[82px] h-[25px] rounded-[32px] bg-gradient-to-r from-[#F5C3AF] via-[#EA89D7] to-[#6767D9] flex items-center justify-center text-white text-[14px] font-medium mr-[8px]">
        Free Trial
      </div>
      <div className="text-black text-[14px] font-medium leading-[20px]">{children}</div>
    </div>
  );
}
