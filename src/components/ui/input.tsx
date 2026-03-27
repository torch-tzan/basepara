import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  // Allow custom composition handling
  onValueChange?: (value: string) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, onChange, onValueChange, onCompositionStart, onCompositionEnd, ...props }, ref) => {
    const isComposingRef = React.useRef(false);

    const handleCompositionStart = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = true;
      onCompositionStart?.(e);
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      onCompositionEnd?.(e);
      // Trigger onChange after composition ends to ensure the final value is captured
      if (onValueChange) {
        onValueChange(e.currentTarget.value);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // For regular onChange, always call it (React's behavior)
      onChange?.(e);
      
      // For onValueChange, only call when not composing (for IME-safe value updates)
      if (onValueChange && !isComposingRef.current) {
        onValueChange(e.target.value);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:bg-secondary/50 dark:border-border dark:placeholder:text-muted-foreground/70",
          "dark:focus-visible:ring-primary/50 dark:focus-visible:ring-offset-background",
          "md:text-sm",
          className,
        )}
        ref={ref}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
