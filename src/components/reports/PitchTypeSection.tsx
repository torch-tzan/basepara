import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PitchCell {
  value: number | string | null;
  prevs?: (number | string | null)[];
}

interface PitchTypeMetric {
  label: string;
  unit?: string;
  values: Record<string, PitchCell>;
  reversed?: boolean;
  decimals?: number;
  showSD?: boolean;
}

// 球種中文全名列表
export const allPitchTypes = ["四縫線", "曲球", "滑球", "變速球"];

const mockPitchMetrics: PitchTypeMetric[] = [
  { label: "球速", unit: "kph", values: { 四縫線: { value: 138.5, prevs: [135.2, 133.0] }, 曲球: { value: 118.3, prevs: [116.0, 114.5] }, 滑球: { value: 125.7, prevs: [123.5, 121.8] }, 變速球: { value: 122.1, prevs: [120.8, 119.5] } }, decimals: 1 },
  { label: "旋轉方向", values: { 四縫線: { value: "12:15" }, 曲球: { value: "7:30" }, 滑球: { value: "9:45" }, 變速球: { value: "1:00" } } },
  { label: "旋轉效率", unit: "%", values: { 四縫線: { value: 95.2, prevs: [94.8, 94.1] }, 曲球: { value: 88.5, prevs: [87.2, 86.0] }, 滑球: { value: 72.3, prevs: [71.0, 69.5] }, 變速球: { value: 91.5, prevs: [90.2, 89.0] } }, decimals: 1 },
  { label: "陀螺角度", unit: "°", values: { 四縫線: { value: 5.2 }, 曲球: { value: 42.5 }, 滑球: { value: 55.3 }, 變速球: { value: 8.1 } }, decimals: 1 },
  { label: "轉速", unit: "rpm", values: { 四縫線: { value: 2250, prevs: [2200, 2150] }, 曲球: { value: 2580, prevs: [2530, 2480] }, 滑球: { value: 2380, prevs: [2340, 2290] }, 變速球: { value: 1820, prevs: [1790, 1750] } }, decimals: 0, showSD: true },
  { label: "垂直位移", unit: "cm", values: { 四縫線: { value: 42.5, prevs: [41.2, 39.8] }, 曲球: { value: -32.1, prevs: [-31.5, -30.8] }, 滑球: { value: 18.3, prevs: [17.8, 17.0] }, 變速球: { value: 35.2, prevs: [34.5, 33.5] } }, decimals: 1, showSD: true },
  { label: "水平位移", unit: "cm", values: { 四縫線: { value: -18.5, prevs: [-17.8, -17.0] }, 曲球: { value: 12.3, prevs: [11.5, 10.8] }, 滑球: { value: -5.2, prevs: [-4.8, -4.2] }, 變速球: { value: -22.1, prevs: [-21.5, -20.8] } }, decimals: 1, showSD: true },
  { label: "出手延伸", unit: "cm", values: { 四縫線: { value: 185.2, prevs: [184.5, 183.8] }, 曲球: { value: 182.3, prevs: [181.8, 181.0] }, 滑球: { value: 183.5, prevs: [183.0, 182.5] }, 變速球: { value: 184.8, prevs: [184.2, 183.5] } }, decimals: 1 },
  { label: "出手高度", unit: "cm", values: { 四縫線: { value: 178.5, prevs: [178.2, 177.8] }, 曲球: { value: 176.3, prevs: [176.0, 175.5] }, 滑球: { value: 177.5, prevs: [177.2, 176.8] }, 變速球: { value: 178.0, prevs: [177.8, 177.2] } }, decimals: 1 },
  { label: "出手側向", unit: "cm", values: { 四縫線: { value: 52.3, prevs: [52.0, 51.8] }, 曲球: { value: 48.5, prevs: [48.2, 47.8] }, 滑球: { value: 50.1, prevs: [49.8, 49.5] }, 變速球: { value: 51.5, prevs: [51.2, 50.8] } }, decimals: 1 },
  { label: "垂直進壘角度", unit: "°", values: { 四縫線: { value: -4.8, prevs: [-5.0, -5.2] }, 曲球: { value: -7.2, prevs: [-7.5, -7.8] }, 滑球: { value: -5.5, prevs: [-5.8, -6.0] }, 變速球: { value: -5.1, prevs: [-5.3, -5.5] } }, decimals: 1 },
  { label: "水平進壘角度", unit: "°", values: { 四縫線: { value: 1.2, prevs: [1.0, 0.8] }, 曲球: { value: -2.5, prevs: [-2.8, -3.0] }, 滑球: { value: -1.8, prevs: [-2.0, -2.2] }, 變速球: { value: 0.8, prevs: [0.5, 0.2] } }, decimals: 1 },
];

const mockArmMetrics: PitchTypeMetric[] = [
  { label: "揮臂速度", unit: "°/s", values: { 四縫線: { value: 4850, prevs: [4780, 4700] }, 曲球: { value: 4520, prevs: [4480, 4420] }, 滑球: { value: 4650, prevs: [4600, 4540] }, 變速球: { value: 4780, prevs: [4730, 4680] } }, decimals: 0 },
  { label: "出手角度", unit: "°", values: { 四縫線: { value: 42.5, prevs: [42.0, 41.8] }, 曲球: { value: 43.2, prevs: [42.8, 42.5] }, 滑球: { value: 42.8, prevs: [42.5, 42.2] }, 變速球: { value: 42.3, prevs: [42.0, 41.8] } }, decimals: 1 },
  { label: "手肘外翻應力", unit: "Nm", values: { 四縫線: { value: 65.2, prevs: [64.5, 63.8] }, 曲球: { value: 58.3, prevs: [57.8, 57.2] }, 滑球: { value: 62.1, prevs: [61.5, 60.8] }, 變速球: { value: 63.5, prevs: [63.0, 62.5] } }, decimals: 1 },
  { label: "投球效率", values: { 四縫線: { value: 2.12, prevs: [2.08, 2.05] }, 曲球: { value: 2.03, prevs: [2.00, 1.98] }, 滑球: { value: 2.02, prevs: [1.98, 1.95] }, 變速球: { value: 1.92, prevs: [1.88, 1.85] } }, decimals: 2 },
];

const fmt = (v: number | string | null | undefined, decimals = 1): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return v.toFixed(decimals);
};

interface PitchTypeSectionProps {
  /** 要顯示幾欄「前次檢測」：0 僅本次、1 +前一次、2 +前前次 */
  previousCount?: number;
  /**
   * 限定顯示單一球種（用於多次檢測模式，每球種獨立一頁）。
   * 不傳或為 undefined 時，一次顯示所有球種（單次檢測模式）。
   */
  singlePitchType?: string;
}

const PitchTypeSection = ({ previousCount = 0, singlePitchType }: PitchTypeSectionProps) => {
  const displayTypes = singlePitchType ? [singlePitchType] : allPitchTypes;
  const isSingle = displayTypes.length === 1;
  const prevCols = Array.from({ length: Math.max(0, previousCount) }, (_, i) => i);

  const renderTable = (title: string, metrics: PitchTypeMetric[]) => (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-foreground mb-3">
        {title}
        {isSingle && <span className="ml-2 text-sm font-normal text-muted-foreground">— {displayTypes[0]}</span>}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className={cn(
                "text-left py-2 px-3 font-medium text-muted-foreground",
                isSingle ? "w-[40%]" : "w-[25%]"
              )}>
                參數
              </th>
              {displayTypes.map((pt) => (
                <th
                  key={pt}
                  className="text-center py-2 px-3 font-medium text-muted-foreground"
                  colSpan={1 + prevCols.length}
                >
                  {isSingle ? displayTypes[0] : pt}
                </th>
              ))}
            </tr>
            {previousCount > 0 && (
              <tr className="border-b border-border/50 bg-muted/20">
                <th></th>
                {displayTypes.flatMap((pt) => [
                  <th key={`${pt}-cur-h`} className="text-center py-1 px-3 text-[10px] text-muted-foreground font-normal">當次</th>,
                  ...prevCols.map((n) => (
                    <th key={`${pt}-prev-h-${n}`} className="text-center py-1 px-3 text-[10px] text-muted-foreground font-normal">
                      前 {n + 1} 次
                    </th>
                  )),
                ])}
              </tr>
            )}
          </thead>
          <tbody>
            {metrics.map((row) => (
              <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 px-3 text-foreground">
                  {row.label}
                  {row.unit && (
                    <span className="text-[10px] text-muted-foreground ml-1">({row.unit})</span>
                  )}
                </td>
                {displayTypes.flatMap((pt) => {
                  const cell = row.values[pt];
                  if (!cell) {
                    return [
                      <td key={`${pt}-cur-${row.label}`} className="py-2 px-3 text-center">—</td>,
                      ...prevCols.map((n) => (
                        <td key={`${pt}-prev-${row.label}-${n}`} className="py-2 px-3 text-center">—</td>
                      )),
                    ];
                  }

                  const firstPrev = cell.prevs?.[0];
                  const arrow =
                    previousCount > 0 && firstPrev != null && typeof cell.value === "number" && typeof firstPrev === "number"
                      ? cell.value > firstPrev
                        ? <ArrowUp className={cn("inline w-3 h-3 ml-1", row.reversed ? "text-red-500" : "text-green-500")} />
                        : cell.value < firstPrev
                        ? <ArrowDown className={cn("inline w-3 h-3 ml-1", row.reversed ? "text-green-500" : "text-red-500")} />
                        : null
                      : null;

                  return [
                    <td key={`${pt}-cur-${row.label}`} className="py-2 px-3 text-center font-medium">
                      {fmt(cell.value, row.decimals)}
                      {arrow}
                    </td>,
                    ...prevCols.map((n) => (
                      <td key={`${pt}-prev-${row.label}-${n}`} className="py-2 px-3 text-center text-muted-foreground text-xs">
                        {fmt(cell.prevs?.[n], row.decimals)}
                      </td>
                    )),
                  ];
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {renderTable("球種數據", mockPitchMetrics)}
      {renderTable("揮臂數據", mockArmMetrics)}
    </>
  );
};

export default PitchTypeSection;
