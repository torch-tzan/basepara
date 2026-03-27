/**
 * 球種篩選元件（投球圖表模組共用）
 * 規格：所有投球圖表需具備球種篩選功能
 * - 篩選選項來自資料欄位 `球種`，動態取得
 * - 每次只顯示單一球種的單一數據（非多選）
 * - 圖表載入前需先選擇要顯示的球種
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// 預設球種選項及顏色（待偉丞提供球種顏色對照表後更新）
export const DEFAULT_PITCH_TYPES = [
  { value: "FB", label: "快速球 (FB)", color: "#ef4444" },
  { value: "CB", label: "曲球 (CB)", color: "#3b82f6" },
  { value: "SL", label: "滑球 (SL)", color: "#22c55e" },
  { value: "CH", label: "變速球 (CH)", color: "#f59e0b" },
  { value: "SP", label: "指叉球 (SP)", color: "#8b5cf6" },
  { value: "CT", label: "切球 (CT)", color: "#ec4899" },
];

interface PitchTypeFilterProps {
  /** 可用的球種選項（預設使用 DEFAULT_PITCH_TYPES） */
  options?: typeof DEFAULT_PITCH_TYPES;
  /** 目前選取的球種 */
  selected: string;
  /** 選取變更回呼 */
  onChange: (pitchType: string) => void;
  /** 是否必選（預設 true） */
  required?: boolean;
  /** 額外的 className */
  className?: string;
}

const PitchTypeFilter = ({
  options = DEFAULT_PITCH_TYPES,
  selected,
  onChange,
  required = true,
  className,
}: PitchTypeFilterProps) => {
  const selectedOption = options.find((o) => o.value === selected);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="選擇球種">
            {selectedOption && (
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
                {selectedOption.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((pt) => (
            <SelectItem key={pt.value} value={pt.value}>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                  style={{ backgroundColor: pt.color }}
                />
                {pt.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {required && !selected && (
        <Badge
          variant="outline"
          className="text-[10px] text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
        >
          請先選擇球種
        </Badge>
      )}
    </div>
  );
};

export default PitchTypeFilter;
