import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface FormCheckboxProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  error?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const FormCheckbox = ({
  label,
  checked,
  onCheckedChange,
  error,
  description,
  disabled,
  id,
  className,
}: FormCheckboxProps) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;
  const descriptionId = `${checkboxId}-description`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={checkboxId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={cn(error && "border-destructive data-[state=checked]:bg-destructive")}
          aria-describedby={
            description && error
              ? `${descriptionId} ${errorId}`
              : description
              ? descriptionId
              : error
              ? errorId
              : undefined
          }
          aria-invalid={!!error}
        />
        <div className="space-y-1 leading-none">
          <Label
            htmlFor={checkboxId}
            className={cn(
              "cursor-pointer",
              error && "text-destructive",
              disabled && "cursor-not-allowed opacity-70"
            )}
          >
            {label}
          </Label>
          {description && !error && (
            <p id={descriptionId} className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
FormCheckbox.displayName = "FormCheckbox";

export { FormCheckbox };
