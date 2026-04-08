import DataTable, { type MetricRow } from "./DataTable";

const mockHittingRows: MetricRow[] = [
  { label: "最高 擊球初速", unit: "km/h", value: 152.3, previousValues: [148.5, 145.2], levelAvg: 145.0, levelSD: 15.0, decimals: 1, dataSource: "MAX(ExitVelocity)" },
  { label: "平均 擊球初速", unit: "km/h", value: 135.2, previousValues: [132.0, 128.8], levelAvg: 128.0, levelSD: 14.0, decimals: 1, showSD: true, sd: 8.5, dataSource: "ExitVelocity" },
  { label: "平均 擊球仰角", unit: "°", value: 12.5, previousValues: [14.2, 15.0], decimals: 1, showSD: true, sd: 8.2, hideArrow: true, okRange: [10, 25], dataSource: "LaunchAngle" },
  { label: "強擊球 擊球仰角", unit: "°", value: 18.3, previousValues: [20.1, 21.5], levelAvg: 16.0, levelSD: 5.0, decimals: 1, formula: "強擊球：顆數<10 取 top5、>50 取 top10%；取該範圍 LaunchAngle 平均", dataSource: "LaunchAngle" },
  { label: "有效擊球仰角比例", unit: "%", value: 45.0, previousValues: [42.0, 39.5], levelAvg: 40.0, levelSD: 12.0, decimals: 1, formula: "初速≥150：LaunchAngle∈[10°,30°]；初速<150：[5°,25°]" },
  { label: "拉/中/推 平均仰角", unit: "°", value: "15/10/8", previousValues: ["16/12/7", "17/11/6"], hideArrow: true, formula: "拉打 HorizontalAngle<-10°、中間 ±10°、推打 >10°，分別取 LaunchAngle 平均" },
  { label: "平均 擊球水平角", unit: "°", value: -5.2, previousValues: [-4.8, -4.5], levelAvg: -3.0, levelSD: 8.0, decimals: 1, dataSource: "HorizontalAngle" },
  { label: "強擊球 擊球水平角", unit: "°", value: -8.5, previousValues: [-7.2, -6.8], levelAvg: -5.0, levelSD: 10.0, decimals: 1, formula: "同強擊球定義，取 HorizontalAngle 平均" },
  { label: "平均飛行距離", unit: "m", value: 65.2, previousValues: [62.8, 60.5], levelAvg: 58.0, levelSD: 15.0, decimals: 1, dataSource: "Distance" },
  { label: "強擊球 飛行距離", unit: "m", value: 85.3, previousValues: [82.1, 79.5], levelAvg: 78.0, levelSD: 18.0, decimals: 1, formula: "同強擊球定義，取 Distance 平均" },
  { label: "碰撞效率", value: 1.18, previousValues: [1.15, 1.12], levelAvg: 1.10, levelSD: 0.15, decimals: 2, formula: "ExitVelocity / PitchSpeed", dataSource: "ExitVelocity, PitchSpeed" },
];

interface HittingDataSectionProps {
  previousCount?: number;
  testMethod?: string;
  ballCount?: number;
  levelLabel?: string;
}

const HittingDataSection = ({
  previousCount = 1,
  testMethod = "實戰",
  ballCount = 30,
  levelLabel,
}: HittingDataSectionProps) => {
  return (
    <DataTable
      title="擊球數據"
      subtitle={`測驗方式：${testMethod}　測驗球數：${ballCount}`}
      rows={mockHittingRows}
      previousCount={previousCount}
      showLevelAvg={true}
      levelLabel={levelLabel}
    />
  );
};

export default HittingDataSection;
