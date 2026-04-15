/**
 * 共用球種多選切換按鈕（靠左對齊，中文標籤）
 * 用於所有投球圖表，取代 ChartModuleCard 上的下拉式 PitchTypeFilter
 */

import { Button } from "@/components/ui/button";

export const PITCH_TYPE_OPTIONS = [
  { type: "FB", label: "速球", color: "#ef4444" },
  { type: "CB", label: "曲球", color: "#3b82f6" },
  { type: "SL", label: "滑球", color: "#22c55e" },
  { type: "CH", label: "變速球", color: "#f59e0b" },
] as const;

/** 取得球種中文名（找不到時返回原代號） */
export function pitchLabel(code: string): string {
  return PITCH_TYPE_OPTIONS.find((p) => p.type === code)?.label ?? code;
}

interface PitchTypeToggleRowProps {
  active: string[];
  onToggle: (type: string) => void;
}

const PitchTypeToggleRow = ({ active, onToggle }: PitchTypeToggleRowProps) => (
  <div className="flex gap-1 justify-start">
    {PITCH_TYPE_OPTIONS.map((pt) => {
      const isOn = active.includes(pt.type);
      return (
        <Button
          key={pt.type}
          variant={isOn ? "default" : "outline"}
          size="sm"
          className="h-7 px-2.5 text-xs"
          style={
            isOn
              ? { backgroundColor: pt.color, borderColor: pt.color, color: "white" }
              : { color: pt.color, borderColor: pt.color }
          }
          onClick={() => onToggle(pt.type)}
        >
          {pt.label}
        </Button>
      );
    })}
  </div>
);

/** 切換 helper：如果只剩一個，保留不讓清空 */
export function togglePitchType(prev: string[], type: string): string[] {
  if (prev.includes(type)) {
    return prev.length === 1 ? prev : prev.filter((p) => p !== type);
  }
  return [...prev, type];
}

export default PitchTypeToggleRow;
