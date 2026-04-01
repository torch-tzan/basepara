import AppLayout from "@/components/layout/AppLayout";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { battingModules, pitchingModules, nonPitchingModules } from "@/data/reportModules";

const ChartOverview = () => {
  return (
    <AppLayout title="圖表總覽">
      <div className="space-y-8">
        {/* 打擊圖表 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
            打擊相關圖表（{battingModules.length} 個模組）
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {battingModules.map((mod) => (
              <ChartModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </section>

        {/* 投球圖表 */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
            投球相關圖表（{pitchingModules.length} 個模組）
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {pitchingModules.map((mod) => (
              <ChartModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </section>

        {/* 非投打圖表 */}
        {nonPitchingModules.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 border-b border-border pb-2">
              體測相關圖表（{nonPitchingModules.length} 個模組）
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {nonPitchingModules.map((mod) => (
                <ChartModuleCard key={mod.id} module={mod} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default ChartOverview;
