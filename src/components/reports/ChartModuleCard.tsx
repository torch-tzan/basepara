/**
 * 圖表模組卡片容器
 * 通用的圖表模組外殼，包含：
 * - 模組標題與規格參考
 * - 情境篩選（打擊）或 球種篩選（投球）
 * - 圖表渲染區域（slot）
 * - 開發狀態提示
 */

import { useState, Suspense, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Info, Loader2 } from "lucide-react";
import ScenarioFilter from "./ScenarioFilter";
import PitchTypeFilter from "./PitchTypeFilter";
import { chartComponentMap } from "./charts";
import { ChartControlsContext, ChartFiltersContext } from "./chartControlsContext";
import type { ReportModule } from "@/data/reportModules";

interface ChartModuleCardProps {
  /** 模組定義 */
  module: ReportModule;
  /** 圖表子元件（若為 null 則顯示 placeholder） */
  children?: ReactNode;
  /** 打擊模組的可用情境選項 */
  scenarioOptions?: string[];
  /** 投球模組的可用球種選項 */
  pitchTypeOptions?: Array<{ value: string; label: string; color: string }>;
  /** 篩選條件變更回呼 */
  onFilterChange?: (filters: ChartFilters) => void;
}

export interface ChartFilters {
  /** 打擊模組：選取的情境列表 */
  scenarios?: string[];
  /** 投球模組：選取的球種 */
  pitchType?: string;
}

const ChartModuleCard = ({
  module,
  children,
  scenarioOptions,
  pitchTypeOptions,
  onFilterChange,
}: ChartModuleCardProps) => {
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [pitchType, setPitchType] = useState("");

  const handleScenariosChange = (newScenarios: string[]) => {
    setScenarios(newScenarios);
    onFilterChange?.({ scenarios: newScenarios });
  };

  const handlePitchTypeChange = (newPitchType: string) => {
    setPitchType(newPitchType);
    onFilterChange?.({ pitchType: newPitchType });
  };

  const isBatting = module.category === "batting";
  const isPitching = module.category === "pitching";

  // Auto-resolve chart component from registry
  const ChartComponent = chartComponentMap[module.id];

  // 圖表子元件用的控制項 slot（mode 切換 / metric select 會 portal 進來）
  const [controlsSlot, setControlsSlot] = useState<HTMLDivElement | null>(null);
  // 圖表子元件用的左側篩選 slot（球種按鈕等）
  const [filtersSlot, setFiltersSlot] = useState<HTMLDivElement | null>(null);

  return (
    <Card className="break-inside-avoid">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary flex-shrink-0" />
          {module.name}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
            {module.specRef}
          </Badge>
        </CardTitle>

        {/* 標題下方：左=情境/球種篩選、右=圖表控制項 slot（列印隱藏） */}
        <div className="flex items-center justify-between gap-2 pt-2 print:hidden">
          <div className="flex items-center gap-2">
            {!module.hideModuleFilter && isBatting && (
              <ScenarioFilter
                options={scenarioOptions}
                selected={scenarios}
                onChange={handleScenariosChange}
              />
            )}
            {!module.hideModuleFilter && isPitching && (
              <PitchTypeFilter
                options={pitchTypeOptions}
                selected={pitchType}
                onChange={handlePitchTypeChange}
              />
            )}
            {/* 圖表自管的篩選器（球種多選等）portal 進來 */}
            {module.hideModuleFilter && (
              <div ref={setFiltersSlot} className="flex items-center gap-2" />
            )}
          </div>
          <div ref={setControlsSlot} className="flex items-center gap-2" />
        </div>
      </CardHeader>

      <CardContent>
        {children ? (
          <ChartFiltersContext.Provider value={filtersSlot}>
            <ChartControlsContext.Provider value={controlsSlot}>
              {children}
            </ChartControlsContext.Provider>
          </ChartFiltersContext.Provider>
        ) : ChartComponent ? (
          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ChartFiltersContext.Provider value={filtersSlot}>
              <ChartControlsContext.Provider value={controlsSlot}>
                <ChartComponent />
              </ChartControlsContext.Provider>
            </ChartFiltersContext.Provider>
          </Suspense>
        ) : (
          /* Fallback placeholder */
          <div className="h-64 rounded-lg bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/20">
            <div className="text-center space-y-2">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">{module.name}</p>
              <p className="text-xs text-muted-foreground/60">{module.description}</p>
              {module.pendingNote && (
                <div className="flex items-center gap-1 justify-center text-[10px] text-yellow-600 dark:text-yellow-400 mt-2">
                  <Info className="w-3 h-3" />
                  {module.pendingNote}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartModuleCard;
