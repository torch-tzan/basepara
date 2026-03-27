import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  label: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: FormSelectOption[];
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const FormSelect = ({
  label,
  value,
  onValueChange,
  options,
  error,
  description,
  required,
  placeholder = "請選擇",
  disabled,
  id,
  className,
}: FormSelectProps) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const descriptionId = `${selectId}-description`;
  const errorId = `${selectId}-error`;

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={selectId} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={selectId}
          className={cn(error && "border-destructive focus:ring-destructive")}
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
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};
FormSelect.displayName = "FormSelect";

export { FormSelect };
