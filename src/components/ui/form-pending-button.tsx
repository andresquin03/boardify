"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormPendingButtonProps = React.ComponentProps<typeof Button> & {
  pendingText?: string;
};

export function FormPendingButton({
  className,
  children,
  disabled,
  pendingText,
  ...props
}: FormPendingButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      aria-busy={pending}
      disabled={pending || disabled}
      className={cn(className, pending && "cursor-wait")}
    >
      {pending && pendingText ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
