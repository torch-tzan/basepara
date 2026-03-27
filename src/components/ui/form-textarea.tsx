import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, description, required, className, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const descriptionId = `${textareaId}-description`;
    const errorId = `${textareaId}-error`;

    return (
      <div className="space-y-2">
        <Label htmlFor={textareaId} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          ref={ref}
          id={textareaId}
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
FormTextarea.displayName = "FormTextarea";

export { FormTextarea };
