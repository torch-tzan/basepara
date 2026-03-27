import * as React from "react";
import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SearchableSelectMultiOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectMultiProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: SearchableSelectMultiOption[];
  error?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxItems?: number;
  minItems?: number;
  className?: string;
}

const SearchableSelectMulti = ({
  label,
  values,
  onChange,
  options,
  error,
  description,
  required,
  placeholder = "選擇項目...",
  searchPlaceholder = "搜尋...",
  emptyText = "找不到結果",
  maxItems = 3,
  minItems = 0,
  className,
}: SearchableSelectMultiProps) => {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const descriptionId = `${generatedId}-description`;
  const errorId = `${generatedId}-error`;

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      // Remove if already selected (but respect minItems)
      if (values.length > minItems) {
        onChange(values.filter((v) => v !== value));
      }
    } else if (values.length < maxItems) {
      // Add if not at max
      onChange([...values, value]);
    }
  };

  const handleRemove = (value: string) => {
    if (values.length > minItems) {
      onChange(values.filter((v) => v !== value));
    }
  };

  const getLabel = (value: string) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  const selectedCount = values.length;
  const canAddMore = selectedCount < maxItems;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {maxItems > 1 && (
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{maxItems}
          </span>
        )}
      </div>

      {/* Selected items as badges */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {getLabel(value)}
              {values.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Searchable dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              !canAddMore && "opacity-50 cursor-not-allowed",
              error && "border-destructive focus:ring-destructive"
            )}
            disabled={!canAddMore}
            aria-invalid={!!error}
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              {canAddMore ? placeholder : `已達上限 (${maxItems})`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = values.includes(option.value);
                  const isDisabled = !isSelected && !canAddMore;

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        if (!isDisabled) {
                          handleSelect(option.value);
                          setOpen(false);
                        }
                      }}
                      disabled={isDisabled}
                      className={cn(isDisabled && "opacity-50")}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
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

SearchableSelectMulti.displayName = "SearchableSelectMulti";

export { SearchableSelectMulti };
