import * as React from "react";
import { Check, ChevronsUpDown, Search, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export interface StudentOption {
  id: string;
  name: string;
  teamName: string;
}

export interface StudentSearchSelectProps {
  students: StudentOption[];
  value: string; // selected student id, or empty string for "all"
  onChange: (id: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAllStudents?: boolean;
  className?: string;
}

const StudentSearchSelect = ({
  students,
  value,
  onChange,
  placeholder = "搜尋學員...",
  disabled = false,
  allowAllStudents = true,
  className,
}: StudentSearchSelectProps) => {
  const [open, setOpen] = React.useState(false);

  const selectedStudent = React.useMemo(() => {
    if (!value || value === "") return null;
    return students.find((s) => s.id === value) || null;
  }, [value, students]);

  const handleSelect = (studentId: string) => {
    onChange(studentId);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "justify-between font-normal",
            !selectedStudent && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            {selectedStudent ? (
              <span className="truncate">
                {selectedStudent.name}
                <span className="text-muted-foreground ml-1">
                  ({selectedStudent.teamName})
                </span>
              </span>
            ) : value === "" && allowAllStudents ? (
              <span>全部學員</span>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedStudent && (
              <span
                role="button"
                onClick={handleClear}
                className="h-4 w-4 p-0 hover:bg-accent rounded cursor-pointer flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>找不到學員</CommandEmpty>
            <CommandGroup>
              {allowAllStudents && (
                <CommandItem
                  value="__all_students__"
                  onSelect={() => handleSelect("")}
                >
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>全部學員</span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              )}
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.name} ${student.teamName}`}
                  onSelect={() => handleSelect(student.id)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {student.teamName}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === student.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

StudentSearchSelect.displayName = "StudentSearchSelect";

export { StudentSearchSelect };
