import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FormSelectMultiOption {
  value: string;
  label: string;
}

export interface FormSelectMultiProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: FormSelectMultiOption[];
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  maxItems?: number;
  minItems?: number;
  addButtonText?: string;
  className?: string;
  disabled?: boolean;
}

const FormSelectMulti = ({
  label,
  values,
  onChange,
  options,
  error,
  description,
  required,
  placeholder = "請選擇",
  maxItems = 3,
  minItems = 1,
  addButtonText = "新增",
  className,
  disabled = false,
}: FormSelectMultiProps) => {
  const generatedId = React.useId();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;

  const handleAdd = () => {
    if (values.length < maxItems) {
      onChange([...values, ""]);
    }
  };

  const handleRemove = (index: number) => {
    if (values.length > minItems) {
      onChange(values.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    onChange(newValues);
  };

  // Get available options for each select (exclude already selected values)
  const getAvailableOptions = (currentValue: string) => {
    return options.map((option) => ({
      ...option,
      disabled: values.includes(option.value) && option.value !== currentValue,
    }));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {values.length < maxItems && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-primary"
            onClick={handleAdd}
            disabled={disabled}
          >
            <Plus className="w-4 h-4" />
            {addButtonText}
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select
              value={value}
              onValueChange={(newValue) => handleChange(index, newValue)}
              disabled={disabled}
            >
              <SelectTrigger
                className={cn(
                  "flex-1",
                  error && "border-destructive focus:ring-destructive"
                )}
                aria-invalid={!!error}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {getAvailableOptions(value).map((option) => (
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
            {values.length > minItems && !disabled && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(index)}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
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
FormSelectMulti.displayName = "FormSelectMulti";

export { FormSelectMulti };
