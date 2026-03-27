/**
 * 情境篩選元件（打擊圖表模組共用）
 * 規格：每個打擊圖表模組上方需有獨立的「情境篩選」下拉選單
 * - 篩選選項來自資料欄位 `測驗情境`，動態從資料庫取得
 * - 支援多選（可選單一或多種情境同時顯示）
 * - 每個模組可獨立操作篩選，不互相影響
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 預設的情境選項（待後續從資料庫動態取得）
const DEFAULT_SCENARIOS = [
  "實戰",
  "拋打",
  "T座",
  "機器",
  "自由打擊",
];

interface ScenarioFilterProps {
  /** 可用的情境選項（預設使用 DEFAULT_SCENARIOS） */
  options?: string[];
  /** 目前選取的情境 */
  selected: string[];
  /** 選取變更回呼 */
  onChange: (selected: string[]) => void;
  /** 額外的 className */
  className?: string;
}

const ScenarioFilter = ({
  options = DEFAULT_SCENARIOS,
  selected,
  onChange,
  className,
}: ScenarioFilterProps) => {
  const [open, setOpen] = useState(false);

  const handleToggle = (scenario: string) => {
    if (selected.includes(scenario)) {
      onChange(selected.filter((s) => s !== scenario));
    } else {
      onChange([...selected, scenario]);
    }
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const handleClear = () => {
    onChange([]);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            情境篩選
            {selected.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 px-1.5 text-[10px] rounded-full"
              >
                {selected.length}
              </Badge>
            )}
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-xs font-medium text-muted-foreground">
                測驗情境
              </span>
              <button
                onClick={handleSelectAll}
                className="text-[10px] text-primary hover:underline"
              >
                {selected.length === options.length ? "取消全選" : "全選"}
              </button>
            </div>
            {options.map((scenario) => (
              <label
                key={scenario}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selected.includes(scenario)}
                  onCheckedChange={() => handleToggle(scenario)}
                  className="h-3.5 w-3.5"
                />
                {scenario}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* 顯示已選取的情境 tags */}
      {selected.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {selected.map((s) => (
            <Badge
              key={s}
              variant="secondary"
              className="text-[10px] h-6 px-2 gap-1 cursor-pointer hover:bg-destructive/10"
              onClick={() => handleToggle(s)}
            >
              {s}
              <X className="w-2.5 h-2.5" />
            </Badge>
          ))}
          {selected.length > 1 && (
            <button
              onClick={handleClear}
              className="text-[10px] text-muted-foreground hover:text-destructive ml-1"
            >
              清除
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioFilter;
