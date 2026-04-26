import DataTable, { type MetricRow } from "./DataTable";
import { getFitnessMockRows } from "@/data/mockStudentMetrics";

// Mock fitness data — previousValues[0] 為前一次、previousValues[1] 為前前次（fallback）
const mockFitnessRows: MetricRow[] = [
  { label: "淨體重", unit: "kg", value: 68.5, previousValues: [67.2, 66.0], levelAvg: 65.0, levelSD: 8.0, decimals: 1 },
  { label: "骨骼肌重", unit: "kg", value: 32.1, previousValues: [31.5, 30.8], levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
  { label: "體脂率", unit: "%", value: 14.2, previousValues: [15.1, 16.0], levelAvg: 16.0, levelSD: 4.0, decimals: 1, reversed: true },
  { label: "反向跳 跳躍高度", unit: "cm", value: 42.5, previousValues: [40.8, 39.2], levelAvg: 38.0, levelSD: 6.0, decimals: 1, showPR: true },
  { label: "落下跳 反應肌力", value: 1.35, previousValues: [1.28, 1.22], levelAvg: 1.20, levelSD: 0.30, decimals: 2, showPR: true },
  { label: "落下跳 觸地時間", unit: "s", value: 0.28, previousValues: [0.30, 0.32], levelAvg: 0.32, levelSD: 0.06, decimals: 2, reversed: true, showPR: true },
  { label: "藥球側拋 慣用手", unit: "kph", value: 52.3, previousValues: [50.1, 48.5], levelAvg: 48.0, levelSD: 8.0, decimals: 1, showPR: true },
  { label: "藥球側拋 非慣用手", unit: "kph", value: 48.7, previousValues: [47.2, 45.8], levelAvg: 45.0, levelSD: 7.0, decimals: 1, showPR: true },
  { label: "握力 慣用手", unit: "kg", value: 42.0, previousValues: [40.5, 39.2], levelAvg: 38.0, levelSD: 8.0, decimals: 1, showPR: true },
  { label: "握力 非慣用手", unit: "kg", value: 39.5, previousValues: [38.0, 36.8], levelAvg: 36.0, levelSD: 7.0, decimals: 1, showPR: true },
  { label: "引體向上", unit: "次", value: 8, previousValues: [6, 5], levelAvg: 5, levelSD: 4, decimals: 0, showPR: true },
  { label: "衝刺 總完成時間", unit: "s", value: 1.635, previousValues: [1.680, 1.720], levelAvg: 1.750, levelSD: 0.150, decimals: 3, reversed: true, showPR: true },
  { label: "衝刺 分段一完成時間", unit: "s", value: 4.825, previousValues: [4.920, 5.010], levelAvg: 5.100, levelSD: 0.350, decimals: 3, reversed: true },
];

interface FitnessSectionProps {
  /** 要顯示幾欄「前次檢測」：0 僅本次、1 +前一次、2 +前前次 */
  previousCount?: number;
  /** 層級標籤（如「高中」） */
  levelLabel?: string;
  /** 是否顯示 PR 值欄位 */
  showPR?: boolean;
  /** 學員 ID — 有值時使用該學員專屬 mock 數據 */
  studentId?: string;
}

const FitnessSection = ({ previousCount = 1, levelLabel, showPR = false, studentId }: FitnessSectionProps) => {
  const rows = studentId ? getFitnessMockRows(studentId) : mockFitnessRows;
  return (
    <DataTable
      title="身體素質"
      rows={rows}
      previousCount={previousCount}
      showLevelAvg={true}
      levelLabel={levelLabel}
      showPR={showPR}
    />
  );
};

export default FitnessSection;
