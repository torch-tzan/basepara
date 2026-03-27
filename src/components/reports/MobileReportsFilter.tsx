import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { StudentSearchSelect, type StudentOption } from "@/components/ui/student-search-select";

interface MobileReportsFilterProps {
  testType: string;
  onTestTypeChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  // Coach-only filters
  isStudent?: boolean;
  searchableStudents?: StudentOption[];
  selectedStudentId?: string;
  onStudentChange?: (value: string) => void;
}

const MobileReportsFilter = ({
  testType,
  onTestTypeChange,
  dateRange,
  onDateRangeChange,
  hasActiveFilters,
  onClearFilters,
  isStudent = false,
  searchableStudents = [],
  selectedStudentId = "",
  onStudentChange,
}: MobileReportsFilterProps) => {
  return (
    <div className="space-y-3">
      {/* Date Range & Report Type - 50% each */}
      <div className="flex gap-2">
        {/* Date Range Picker - 50% */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-1/2 justify-start text-left font-normal h-9 text-xs",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {dateRange?.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "MM/dd")} - ${format(dateRange.to, "MM/dd")}`
                  ) : (
                    format(dateRange.from, "MM/dd")
                  )
                ) : (
                  "選擇日期"
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from || new Date()}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={1}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Report Type Selector - 50% */}
        <Select value={testType} onValueChange={onTestTypeChange}>
          <SelectTrigger className="w-1/2 h-9 text-xs">
            <SelectValue placeholder="全部類型" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">全部類型</SelectItem>
            <SelectItem value="投球">投球</SelectItem>
            <SelectItem value="打擊">打擊</SelectItem>
            <SelectItem value="體測">體測</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Coach-only: Student search */}
      {!isStudent && searchableStudents.length > 0 && (
        <StudentSearchSelect
          students={searchableStudents}
          value={selectedStudentId || ""}
          onChange={onStudentChange || (() => {})}
          placeholder="搜尋學員..."
          allowAllStudents={true}
          className="w-full h-9"
        />
      )}

      {/* Clear Filter Button - hug width, only when filters active */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs text-muted-foreground"
          onClick={onClearFilters}
        >
          <X className="w-3.5 h-3.5 mr-1.5" />
          清除篩選
        </Button>
      )}
    </div>
  );
};

export default MobileReportsFilter;
