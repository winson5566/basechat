import { useFormStatus } from "react-dom";

import { Button, ButtonProps } from "./button";

export function FormCancelButton({ children, disabled, ...props }: ButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="button" variant="secondary" disabled={pending || !!disabled} {...props}>
      {children}
    </Button>
  );
}
