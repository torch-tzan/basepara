import { useMemo } from "react";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { useTeams } from "@/contexts/TeamsContext";
import { useStudents } from "@/contexts/StudentsContext";
import { countyOptions, getTeamLevelOptionsByAttribute } from "@/data/teamsConfig";

/** 運動類別：棒球 / 壘球，影響層級可選清單 */
export type Sport = "baseball" | "softball";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════
export type TargetType = "individual" | "school" | "level" | "county";

/** 性別篩選值：male / female / all（不依性別篩） */
export type GenderFilter = "male" | "female" | "all";

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
  /**
   * 性別篩選：適用於非個人目標（學校/層級/縣市），用以篩選母體。
   * 預設為 "male"；個人目標不使用此欄位。
   */
  gender?: GenderFilter;
}

const targetTypeOptions: FormSelectOption[] = [
  { value: "individual", label: "個人" },
  { value: "school", label: "學校" },
  { value: "level", label: "層級" },
  { value: "county", label: "縣市" },
];

const genderOptions: FormSelectOption[] = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "all", label: "全部（不篩選）" },
];

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════
interface TargetSelectorProps {
  /** 標籤，如 "A" 或 "B" */
  side: string;
  target: ComparisonTarget | null;
  onChange: (target: ComparisonTarget | null) => void;
  /** 運動類別 — 決定層級可選清單（棒球 9 種 / 壘球 2 種）。預設 baseball */
  sport?: Sport;
}

const TargetSelector = ({ side, target, onChange, sport = "baseball" }: TargetSelectorProps) => {
  const { teams } = useTeams();
  const { students } = useStudents();

  /** 依運動類別動態取得層級選項 */
  const levelOptions = useMemo<FormSelectOption[]>(
    () => getTeamLevelOptionsByAttribute(sport === "softball" ? "壘球" : "棒球"),
    [sport]
  );

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
        return levelOptions;
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
        return levelOptions.find((o) => o.value === id)?.label || id;
      case "county":
        return countyOptions.find((o) => o.value === id)?.label || id;
    }
  };

  const handleTypeChange = (newType: string) => {
    // 切換到非個人時，預設 gender = "male"（user instruction：所有性別欄位預設男性）
    const isNonIndividual = newType !== "individual";
    onChange({
      type: newType as TargetType,
      id: "",
      label: "",
      gender: isNonIndividual ? "male" : undefined,
    });
  };

  const handleValueChange = (newId: string) => {
    if (!target) return;
    onChange({
      type: target.type,
      id: newId,
      label: findLabel(target.type, newId),
      secondary: target.secondary,
      gender: target.gender,
    });
  };

  // 進階篩選（縣市時可選層級、層級時可選縣市）
  const supportsSecondary = target?.type === "level" || target?.type === "county";
  const secondaryType: "level" | "county" | null =
    target?.type === "level" ? "county" : target?.type === "county" ? "level" : null;
  const secondaryOptions: FormSelectOption[] = useMemo(() => {
    const none: FormSelectOption = { value: "__none__", label: "全部（不篩選）" };
    if (secondaryType === "county") return [none, ...countyOptions];
    if (secondaryType === "level") return [none, ...levelOptions];
    return [];
  }, [secondaryType, levelOptions]);
  const secondaryLabel = secondaryType === "county" ? "縣市（選填）" : "層級（選填）";

  const handleSecondaryChange = (val: string) => {
    if (!target || !secondaryType) return;
    const isNone = !val || val === "__none__";
    onChange({
      ...target,
      secondary: isNone ? undefined : { type: secondaryType, id: val },
    });
  };

  // 性別篩選：適用於非個人目標（學校/層級/縣市）
  const supportsGender = !!target?.type && target.type !== "individual";
  const handleGenderChange = (val: string) => {
    if (!target) return;
    onChange({
      ...target,
      gender: val as GenderFilter,
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
      {supportsGender && (
        <FormSelect
          label="性別"
          value={target?.gender || "male"}
          onValueChange={handleGenderChange}
          options={genderOptions}
          placeholder="選擇性別"
        />
      )}
    </div>
  );
};

export default TargetSelector;
