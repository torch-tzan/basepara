import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface PitchTypeMetric {
  label: string;
  unit?: string;
  values: Record<string, { value: number | string | null; prev?: number | string | null }>;
  reversed?: boolean;
  decimals?: number;
  showSD?: boolean;
}

// 球種中文全名列表
export const allPitchTypes = ["四縫線", "曲球", "滑球", "變速球"];

const mockPitchMetrics: PitchTypeMetric[] = [
  { label: "球速", unit: "kph", values: { 四縫線: { value: 138.5, prev: 135.2 }, 曲球: { value: 118.3, prev: 116.0 }, 滑球: { value: 125.7, prev: 123.5 }, 變速球: { value: 122.1, prev: 120.8 } }, decimals: 1 },
  { label: "旋轉方向", values: { 四縫線: { value: "12:15" }, 曲球: { value: "7:30" }, 滑球: { value: "9:45" }, 變速球: { value: "1:00" } } },
  { label: "旋轉效率", unit: "%", values: { 四縫線: { value: 95.2, prev: 94.8 }, 曲球: { value: 88.5, prev: 87.2 }, 滑球: { value: 72.3, prev: 71.0 }, 變速球: { value: 91.5, prev: 90.2 } }, decimals: 1 },
  { label: "陀螺角度", unit: "°", values: { 四縫線: { value: 5.2 }, 曲球: { value: 42.5 }, 滑球: { value: 55.3 }, 變速球: { value: 8.1 } }, decimals: 1 },
  { label: "轉速", unit: "rpm", values: { 四縫線: { value: 2250, prev: 2200 }, 曲球: { value: 2580, prev: 2530 }, 滑球: { value: 2380, prev: 2340 }, 變速球: { value: 1820, prev: 1790 } }, decimals: 0, showSD: true },
  { label: "垂直位移", unit: "cm", values: { 四縫線: { value: 42.5, prev: 41.2 }, 曲球: { value: -32.1, prev: -31.5 }, 滑球: { value: 18.3, prev: 17.8 }, 變速球: { value: 35.2, prev: 34.5 } }, decimals: 1, showSD: true },
  { label: "水平位移", unit: "cm", values: { 四縫線: { value: -18.5, prev: -17.8 }, 曲球: { value: 12.3, prev: 11.5 }, 滑球: { value: -5.2, prev: -4.8 }, 變速球: { value: -22.1, prev: -21.5 } }, decimals: 1, showSD: true },
  { label: "出手延伸", unit: "cm", values: { 四縫線: { value: 185.2, prev: 184.5 }, 曲球: { value: 182.3, prev: 181.8 }, 滑球: { value: 183.5, prev: 183.0 }, 變速球: { value: 184.8, prev: 184.2 } }, decimals: 1 },
  { label: "出手高度", unit: "cm", values: { 四縫線: { value: 178.5, prev: 178.2 }, 曲球: { value: 176.3, prev: 176.0 }, 滑球: { value: 177.5, prev: 177.2 }, 變速球: { value: 178.0, prev: 177.8 } }, decimals: 1 },
  { label: "出手側向", unit: "cm", values: { 四縫線: { value: 52.3, prev: 52.0 }, 曲球: { value: 48.5, prev: 48.2 }, 滑球: { value: 50.1, prev: 49.8 }, 變速球: { value: 51.5, prev: 51.2 } }, decimals: 1 },
  { label: "垂直進壘角度", unit: "°", values: { 四縫線: { value: -4.8, prev: -5.0 }, 曲球: { value: -7.2, prev: -7.5 }, 滑球: { value: -5.5, prev: -5.8 }, 變速球: { value: -5.1, prev: -5.3 } }, decimals: 1 },
  { label: "水平進壘角度", unit: "°", values: { 四縫線: { value: 1.2, prev: 1.0 }, 曲球: { value: -2.5, prev: -2.8 }, 滑球: { value: -1.8, prev: -2.0 }, 變速球: { value: 0.8, prev: 0.5 } }, decimals: 1 },
];

const mockArmMetrics: PitchTypeMetric[] = [
  { label: "揮臂速度", unit: "°/s", values: { 四縫線: { value: 4850, prev: 4780 }, 曲球: { value: 4520, prev: 4480 }, 滑球: { value: 4650, prev: 4600 }, 變速球: { value: 4780, prev: 4730 } }, decimals: 0 },
  { label: "出手角度", unit: "°", values: { 四縫線: { value: 42.5, prev: 42.0 }, 曲球: { value: 43.2, prev: 42.8 }, 滑球: { value: 42.8, prev: 42.5 }, 變速球: { value: 42.3, prev: 42.0 } }, decimals: 1 },
  { label: "手肘外翻應力", unit: "Nm", values: { 四縫線: { value: 65.2, prev: 64.5 }, 曲球: { value: 58.3, prev: 57.8 }, 滑球: { value: 62.1, prev: 61.5 }, 變速球: { value: 63.5, prev: 63.0 } }, decimals: 1 },
  { label: "投球效率", values: { 四縫線: { value: 2.12, prev: 2.08 }, 曲球: { value: 2.03, prev: 2.00 }, 滑球: { value: 2.02, prev: 1.98 }, 變速球: { value: 1.92, prev: 1.88 } }, decimals: 2 },
];

const fmt = (v: number | string | null | undefined, decimals = 1): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return v.toFixed(decimals);
};

interface PitchTypeSectionProps {
  /** 顯示前次比較數據 */
  showPrevious?: boolean;
  /**
   * 限定顯示單一球種（用於多次檢測模式，每球種獨立一頁）。
   * 不傳或為 undefined 時，一次顯示所有球種（單次檢測模式）。
   */
  singlePitchType?: string;
}

const PitchTypeSection = ({ showPrevious = false, singlePitchType }: PitchTypeSectionProps) => {
  // 決定要渲染的球種欄位
  const displayTypes = singlePitchType ? [singlePitchType] : allPitchTypes;
  const isSingle = displayTypes.length === 1;

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
                <th key={pt} className="text-center py-2 px-3 font-medium text-muted-foreground">
                  {isSingle ? "當次數據" : pt}
                  {showPrevious && (
                    <span className="block text-[10px] font-normal">
                      {isSingle ? "(當次 / 前次)" : "(當次 / 前次)"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
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
                {displayTypes.map((pt) => {
                  const cell = row.values[pt];
                  if (!cell) return <td key={pt} className="py-2 px-3 text-center">—</td>;

                  const arrow =
                    showPrevious && cell.prev != null && typeof cell.value === "number" && typeof cell.prev === "number"
                      ? cell.value > cell.prev
                        ? <ArrowUp className={cn("inline w-3 h-3 ml-1", row.reversed ? "text-red-500" : "text-green-500")} />
                        : cell.value < cell.prev
                        ? <ArrowDown className={cn("inline w-3 h-3 ml-1", row.reversed ? "text-green-500" : "text-red-500")} />
                        : null
                      : null;

                  return (
                    <td key={pt} className="py-2 px-3 text-center font-medium">
                      {fmt(cell.value, row.decimals)}
                      {showPrevious && cell.prev != null && (
                        <span className="text-muted-foreground text-xs ml-1">
                          / {fmt(cell.prev, row.decimals)}
                        </span>
                      )}
                      {arrow}
                    </td>
                  );
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
