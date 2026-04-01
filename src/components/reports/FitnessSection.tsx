import DataTable, { type MetricRow } from "./DataTable";

// Mock fitness data for demonstration
const mockFitnessRows: MetricRow[] = [
  { label: "淨體重", unit: "kg", value: 68.5, previousValue: 67.2, levelAvg: 65.0, levelSD: 8.0, decimals: 1 },
  { label: "骨骼肌重", unit: "kg", value: 32.1, previousValue: 31.5, levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
  { label: "體脂率", unit: "%", value: 14.2, previousValue: 15.1, levelAvg: 16.0, levelSD: 4.0, decimals: 1, reversed: true },
  { label: "反向跳 跳躍高度", unit: "cm", value: 42.5, previousValue: 40.8, levelAvg: 38.0, levelSD: 6.0, decimals: 1 },
  { label: "落下跳 反應肌力", value: 1.35, previousValue: 1.28, levelAvg: 1.20, levelSD: 0.30, decimals: 2 },
  { label: "落下跳 觸地時間", unit: "s", value: 0.28, previousValue: 0.30, levelAvg: 0.32, levelSD: 0.06, decimals: 2, reversed: true },
  { label: "藥球側拋 慣用手", unit: "kph", value: 52.3, previousValue: 50.1, levelAvg: 48.0, levelSD: 8.0, decimals: 1 },
  { label: "藥球側拋 非慣用手", unit: "kph", value: 48.7, previousValue: 47.2, levelAvg: 45.0, levelSD: 7.0, decimals: 1 },
  { label: "握力 慣用手", unit: "kg", value: 42.0, previousValue: 40.5, levelAvg: 38.0, levelSD: 8.0, decimals: 1 },
  { label: "握力 非慣用手", unit: "kg", value: 39.5, previousValue: 38.0, levelAvg: 36.0, levelSD: 7.0, decimals: 1 },
  { label: "引體向上", unit: "次", value: 8, previousValue: 6, levelAvg: 5, levelSD: 4, decimals: 0 },
];

interface FitnessSectionProps {
  showPrevious?: boolean;
}

const FitnessSection = ({ showPrevious = true }: FitnessSectionProps) => {
  return (
    <DataTable
      title="身體素質"
      rows={mockFitnessRows}
      showPrevious={showPrevious}
      showLevelAvg={true}
    />
  );
};

export default FitnessSection;
