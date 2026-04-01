import ChartModuleCard from "./ChartModuleCard";
import { getModuleById } from "@/data/reportModules";

interface ChartSectionProps {
  /** 要顯示的圖表模組 ID 列表 */
  moduleIds: string[];
}

const ChartSection = ({ moduleIds }: ChartSectionProps) => {
  const modules = moduleIds
    .map((id) => getModuleById(id))
    .filter((m) => m != null);

  if (modules.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-foreground">圖表分析</h3>
      <div className="grid grid-cols-1 gap-6">
        {modules.map((mod) => (
          <ChartModuleCard key={mod.id} module={mod} />
        ))}
      </div>
    </div>
  );
};

export default ChartSection;
