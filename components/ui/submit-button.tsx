import { useFormStatus } from "react-dom";

import { Button, ButtonProps } from "./button";

export function SubmitButton({ children, disabled, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" loading={pending} disabled={pending || !!disabled} {...props}>
      {pending ? (pendingText ?? "Submitting...") : children}
    </Button>
  );
}
