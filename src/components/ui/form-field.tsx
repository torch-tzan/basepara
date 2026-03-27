import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface FormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, description, required, className, id, value, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    
    // Track composition state for IME input
    const isComposingRef = React.useRef(false);
    const [localValue, setLocalValue] = React.useState(value || '');
    
    // Sync local value with external value when not composing
    React.useEffect(() => {
      if (!isComposingRef.current) {
        setLocalValue(value || '');
      }
    }, [value]);

    const handleCompositionStart = () => {
      isComposingRef.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      // After composition ends, trigger onChange with the final value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: e.currentTarget,
          currentTarget: e.currentTarget,
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
      // Only call onChange when not composing (for IME input safety)
      if (!isComposingRef.current && onChange) {
        onChange(e);
      }
    };

    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          ref={ref}
          id={inputId}
          className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
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
          value={localValue}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          {...props}
        />
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
  }
);
FormField.displayName = "FormField";

export { FormField };
