import DataTable, { type MetricRow } from "./DataTable";

const mockHittingRows: MetricRow[] = [
  { label: "最高 擊球初速", unit: "km/h", value: 152.3, previousValue: 148.5, levelAvg: 145.0, levelSD: 15.0, decimals: 1 },
  { label: "平均 擊球初速", unit: "km/h", value: 135.2, previousValue: 132.0, levelAvg: 128.0, levelSD: 14.0, decimals: 1, showSD: true, sd: 8.5 },
  { label: "平均 擊球仰角", unit: "°", value: 12.5, previousValue: 14.2, levelAvg: 12.0, levelSD: 6.0, decimals: 1, showSD: true, sd: 8.2, hideArrow: true },
  { label: "強擊球 擊球仰角", unit: "°", value: 18.3, previousValue: 20.1, levelAvg: 16.0, levelSD: 5.0, decimals: 1 },
  { label: "有效擊球仰角比例", unit: "%", value: 45.0, previousValue: 42.0, levelAvg: 40.0, levelSD: 12.0, decimals: 1 },
  { label: "拉/中/推 平均仰角", unit: "°", value: "15/10/8", previousValue: "16/12/7", hideArrow: true },
  { label: "平均 擊球水平角", unit: "°", value: -5.2, previousValue: -4.8, levelAvg: -3.0, levelSD: 8.0, decimals: 1 },
  { label: "強擊球 擊球水平角", unit: "°", value: -8.5, previousValue: -7.2, levelAvg: -5.0, levelSD: 10.0, decimals: 1 },
  { label: "平均飛行距離", unit: "m", value: 65.2, previousValue: 62.8, levelAvg: 58.0, levelSD: 15.0, decimals: 1 },
  { label: "強擊球 飛行距離", unit: "m", value: 85.3, previousValue: 82.1, levelAvg: 78.0, levelSD: 18.0, decimals: 1 },
  { label: "碰撞效率", value: 1.18, previousValue: 1.15, levelAvg: 1.10, levelSD: 0.15, decimals: 2 },
];

interface HittingDataSectionProps {
  showPrevious?: boolean;
  testMethod?: string;
  ballCount?: number;
}

const HittingDataSection = ({
  showPrevious = true,
  testMethod = "實戰",
  ballCount = 30,
}: HittingDataSectionProps) => {
  return (
    <DataTable
      title="擊球數據"
      subtitle={`測驗方式：${testMethod}　測驗球數：${ballCount}`}
      rows={mockHittingRows}
      showPrevious={showPrevious}
      showLevelAvg={true}
    />
  );
};

export default HittingDataSection;
