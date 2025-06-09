import { Button, ButtonProps } from "./ui/button";

interface PrimaryButtonProps extends ButtonProps {
  children: React.ReactNode;
  className?: string;
}

export default function PrimaryButton({ children, className, ...props }: PrimaryButtonProps) {
  return (
    <Button
      {...props}
      className={`bg-[#D946EF] hover:bg-[#D946EF] focus-visible:ring-0 flex items-center font-semibold text-white rounded-lg px-4 py-2.5 ml-3 shadow-none ${className || ""}`}
    >
      {children}
    </Button>
  );
}
