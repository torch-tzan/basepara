import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface FormDatePickerProps {
  label: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  id?: string;
  className?: string;
  /** Enable year/month dropdown for quick navigation (useful for birthdays) */
  showYearDropdown?: boolean;
  /** Start year for dropdown (default: 1950) */
  fromYear?: number;
  /** End year for dropdown (default: current year) */
  toYear?: number;
}

const FormDatePicker = ({
  label,
  value,
  onChange,
  error,
  description,
  required,
  placeholder = "選擇日期",
  disabled,
  id,
  className,
  showYearDropdown = false,
  fromYear = 1950,
  toYear = new Date().getFullYear(),
}: FormDatePickerProps) => {
  const generatedId = React.useId();
  const pickerId = id || generatedId;
  const descriptionId = `${pickerId}-description`;
  const errorId = `${pickerId}-error`;
  
  // Set default month to value or a reasonable default for birthday selection
  const defaultMonth = value || (showYearDropdown ? new Date(2000, 0) : undefined);

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={pickerId} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={pickerId}
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground",
              error && "border-destructive focus-visible:ring-destructive"
            )}
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
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "yyyy/MM/dd") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            disabled={disabled}
            initialFocus
            showYearDropdown={showYearDropdown}
            fromYear={fromYear}
            toYear={toYear}
            defaultMonth={defaultMonth}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
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
FormDatePicker.displayName = "FormDatePicker";

export { FormDatePicker };
