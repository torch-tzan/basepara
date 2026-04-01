import DataTable, { type MetricRow } from "./DataTable";

const mockSwingRows: MetricRow[] = [
  { label: "平均 揮棒速度", unit: "km/h", value: 112.3, previousValue: 108.5, levelAvg: 105.0, levelSD: 12.0, decimals: 1 },
  { label: "最高 揮棒速度", unit: "km/h", value: 121.5, previousValue: 118.2, levelAvg: 115.0, levelSD: 14.0, decimals: 1 },
  { label: "最高/平均 揮棒速度 比值", value: 0.924, previousValue: 0.918, levelAvg: 0.910, levelSD: 0.04, decimals: 3 },
  { label: "平均 峰值手腕速度", unit: "km/h", value: 85.2, previousValue: 83.1, levelAvg: 80.0, levelSD: 10.0, decimals: 1 },
  { label: "有效攻擊角度比例", unit: "%", value: 62.5, previousValue: 58.0, levelAvg: 55.0, levelSD: 15.0, decimals: 1 },
  { label: "平均 攻擊角度", unit: "°", value: 10.2, previousValue: 11.5, levelAvg: 10.0, levelSD: 4.0, decimals: 1, hideArrow: true },
  { label: "平均 揮擊時間", unit: "s", value: 0.148, previousValue: 0.152, levelAvg: 0.155, levelSD: 0.015, decimals: 3, reversed: true },
  { label: "平均 連結性差異", value: -2.5, previousValue: -3.1, levelAvg: -2.0, levelSD: 2.0, decimals: 1, reversed: true },
  { label: "平均 球棒垂直角度", unit: "°", value: 28.5, previousValue: 29.0, levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
  { label: "平均 平面重和率", unit: "%", value: 82.3, previousValue: 80.1, levelAvg: 78.0, levelSD: 8.0, decimals: 1 },
];

interface SwingDataSectionProps {
  showPrevious?: boolean;
  testMethod?: string;
  ballCount?: number;
}

const SwingDataSection = ({
  showPrevious = true,
  testMethod = "實戰",
  ballCount = 30,
}: SwingDataSectionProps) => {
  return (
    <DataTable
      title="揮棒數據"
      subtitle={`測驗方式：${testMethod}　測驗球數：${ballCount}`}
      rows={mockSwingRows}
      showPrevious={showPrevious}
      showLevelAvg={true}
    />
  );
};

export default SwingDataSection;
