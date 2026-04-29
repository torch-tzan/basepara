import DataTable, { type MetricRow } from "./DataTable";
import { getSwingMockRows } from "@/data/mockStudentMetrics";

const mockSwingRows: MetricRow[] = [
  { label: "平均 揮棒速度", unit: "km/h", value: 112.3, previousValues: [108.5, 105.8], levelAvg: 105.0, levelSD: 12.0, decimals: 1, showSD: true, sd: 6.5, showPR: true },
  { label: "最高 揮棒速度", unit: "km/h", value: 121.5, previousValues: [118.2, 115.0], levelAvg: 115.0, levelSD: 14.0, decimals: 1, showPR: true },
  { label: "平均/最高 揮棒速度 比值", value: 0.924, previousValues: [0.918, 0.910], levelAvg: 0.910, levelSD: 0.04, decimals: 3, showPR: true },
  { label: "平均 峰值手腕速度", unit: "km/h", value: 85.2, previousValues: [83.1, 81.5], levelAvg: 80.0, levelSD: 10.0, decimals: 1, showPR: true },
  { label: "有效攻擊角度比例", unit: "%", value: 62.5, previousValues: [58.0, 54.2], levelAvg: 55.0, levelSD: 15.0, decimals: 1, showPR: true },
  { label: "平均 攻擊角度", unit: "°", value: 10.2, previousValues: [11.5, 12.0], decimals: 1, showSD: true, sd: 7.8, hideArrow: true, okRange: [5, 20] },
  { label: "平均 揮擊時間", unit: "s", value: 0.148, previousValues: [0.152, 0.158], levelAvg: 0.155, levelSD: 0.015, decimals: 3, reversed: true, showPR: true },
  { label: "平均 連結性差異", value: -2.5, previousValues: [-3.1, -3.5], levelAvg: -2.0, levelSD: 2.0, decimals: 1, reversed: true },
  { label: "平均 球棒垂直角度", unit: "°", value: 28.5, previousValues: [29.0, 29.8], levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
  { label: "平均 平面重和率", unit: "%", value: 82.3, previousValues: [80.1, 78.5], levelAvg: 78.0, levelSD: 8.0, decimals: 1 },
];

interface SwingDataSectionProps {
  previousCount?: number;
  testMethod?: string;
  ballCount?: number;
  levelLabel?: string;
  /** 是否顯示 PR 值欄位 */
  showPR?: boolean;
  /** 學員 ID — 有值時使用該學員專屬 mock 數據 */
  studentId?: string;
}

const SwingDataSection = ({
  previousCount = 1,
  testMethod = "實戰",
  ballCount = 30,
  levelLabel,
  showPR = false,
  studentId,
}: SwingDataSectionProps) => {
  const rows = studentId ? getSwingMockRows(studentId) : mockSwingRows;
  return (
    <DataTable
      title="揮棒數據"
      subtitle={`測驗方式：${testMethod}　測驗球數：${ballCount}`}
      rows={rows}
      previousCount={previousCount}
      showLevelAvg={true}
      levelLabel={levelLabel}
      showPR={showPR}
    />
  );
};

export default SwingDataSection;
