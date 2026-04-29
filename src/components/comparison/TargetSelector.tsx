import { useMemo } from "react";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { useTeams } from "@/contexts/TeamsContext";
import { useStudents } from "@/contexts/StudentsContext";
import { teamLevelOptions, countyOptions } from "@/data/teamsConfig";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════
export type TargetType = "individual" | "school" | "level" | "county";

export interface ComparisonTarget {
  type: TargetType;
  /** student ID / team ID / level value / county value */
  id: string;
  /** 顯示名稱 */
  label: string;
  /**
   * 進階篩選：層級型可選縣市、縣市型可選層級。為空字串代表不額外篩選。
   * 例：type="level", id="高中甲組", secondary={ type:"county", id:"新北市" }
   *   = 篩選「新北市的高中甲組」
   */
  secondary?: { type: "level" | "county"; id: string };
}

const targetTypeOptions: FormSelectOption[] = [
  { value: "individual", label: "個人" },
  { value: "school", label: "學校" },
  { value: "level", label: "層級" },
  { value: "county", label: "縣市" },
];

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════
interface TargetSelectorProps {
  /** 標籤，如 "A" 或 "B" */
  side: string;
  target: ComparisonTarget | null;
  onChange: (target: ComparisonTarget | null) => void;
}

const TargetSelector = ({ side, target, onChange }: TargetSelectorProps) => {
  const { teams } = useTeams();
  const { students } = useStudents();

  // 動態生成「值」選項
  const studentOptions: FormSelectOption[] = useMemo(
    () =>
      students.map((s) => ({
        value: s.id,
        label: `${s.name}${s.teamName ? ` (${s.teamName})` : ""}`,
      })),
    [students]
  );

  const schoolOptions: FormSelectOption[] = useMemo(
    () => teams.map((t) => ({ value: t.id, label: t.name })),
    [teams]
  );

  // 取得值選項
  const getValueOptions = (): FormSelectOption[] => {
    if (!target) return [];
    switch (target.type) {
      case "individual":
        return studentOptions;
      case "school":
        return schoolOptions;
      case "level":
        return teamLevelOptions;
      case "county":
        return countyOptions;
    }
  };

  // 取得值選項的 placeholder
  const getValuePlaceholder = (): string => {
    if (!target) return "請先選擇類型";
    switch (target.type) {
      case "individual":
        return "選擇學員";
      case "school":
        return "選擇學校";
      case "level":
        return "選擇層級";
      case "county":
        return "選擇縣市";
    }
  };

  // 從選項中找 label
  const findLabel = (type: TargetType, id: string): string => {
    switch (type) {
      case "individual":
        return studentOptions.find((o) => o.value === id)?.label || id;
      case "school":
        return schoolOptions.find((o) => o.value === id)?.label || id;
      case "level":
        return teamLevelOptions.find((o) => o.value === id)?.label || id;
      case "county":
        return countyOptions.find((o) => o.value === id)?.label || id;
    }
  };

  const handleTypeChange = (newType: string) => {
    onChange({ type: newType as TargetType, id: "", label: "" });
  };

  const handleValueChange = (newId: string) => {
    if (!target) return;
    onChange({
      type: target.type,
      id: newId,
      label: findLabel(target.type, newId),
      secondary: target.secondary,
    });
  };

  // 進階篩選（縣市時可選層級、層級時可選縣市）
  const supportsSecondary = target?.type === "level" || target?.type === "county";
  const secondaryType: "level" | "county" | null =
    target?.type === "level" ? "county" : target?.type === "county" ? "level" : null;
  const secondaryOptions: FormSelectOption[] = useMemo(() => {
    const none: FormSelectOption = { value: "__none__", label: "全部（不篩選）" };
    if (secondaryType === "county") return [none, ...countyOptions];
    if (secondaryType === "level") return [none, ...teamLevelOptions];
    return [];
  }, [secondaryType]);
  const secondaryLabel = secondaryType === "county" ? "縣市（選填）" : "層級（選填）";

  const handleSecondaryChange = (val: string) => {
    if (!target || !secondaryType) return;
    const isNone = !val || val === "__none__";
    onChange({
      ...target,
      secondary: isNone ? undefined : { type: secondaryType, id: val },
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-muted-foreground">比較對象 {side}</p>
      <FormSelect
        label="類型"
        value={target?.type || ""}
        onValueChange={handleTypeChange}
        options={targetTypeOptions}
        placeholder="選擇類型"
      />
      <FormSelect
        label="選擇"
        value={target?.id || ""}
        onValueChange={handleValueChange}
        options={getValueOptions()}
        placeholder={getValuePlaceholder()}
        disabled={!target?.type}
      />
      {supportsSecondary && (
        <FormSelect
          label={secondaryLabel}
          value={target?.secondary?.id || "__none__"}
          onValueChange={handleSecondaryChange}
          options={secondaryOptions}
          placeholder="選填"
        />
      )}
    </div>
  );
};

export default TargetSelector;
