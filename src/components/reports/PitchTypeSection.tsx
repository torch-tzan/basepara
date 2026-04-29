import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getPitchMockMetrics, getArmMockMetrics } from "@/data/mockStudentMetrics";
import { getMetricDescription } from "@/data/metricDescriptions";

interface PitchCell {
  value: number | string | null;
  prevs?: (number | string | null)[];
  /** 標準差（搭配 row.showSD 使用，顯示 mean±SD） */
  sd?: number | null;
}

interface PitchTypeMetric {
  label: string;
  unit?: string;
  values: Record<string, PitchCell>;
  reversed?: boolean;
  decimals?: number;
  showSD?: boolean;
  /** 公式說明（顯示為 tooltip） */
  formula?: string;
  /** 資料來源欄位名（顯示為 tooltip） */
  dataSource?: string;
}

// 球種中文全名列表
export const allPitchTypes = ["四縫線", "曲球", "滑球", "變速球"];

/**
 * 球種數據 / 揮臂數據的「層級平均 ± 0.5SD」基準（mock）
 * 以高中層級為 baseline；其他層級透過倍率調整（與身體素質的層級對照邏輯一致）。
 * key = 指標 label；inner key = 球種；值為 [平均, SD]
 */
/**
 * 層級基準支援：
 *  - 細粒度棒球（9 種）：來自 #6c 後的 ReportNew.LevelBaseline
 *  - 粗粒度棒球（4 種）：保留以相容 PR #9 之前產出的舊報告
 *  - 壘球（2 種）：依屬性帶入
 */
type LevelBaseline = string;

/**
 * 不同層級對 baseline（以「高中甲組」為基準 = 1.0）的乘數。
 * 棒球棒次由低到高遞增；壘球因投球機制差異大，倍率大幅縮小（slow pitch ~40%, fast pitch ~55%）。
 * 這些是 mock 數值，僅供 UI 驗收，實際資料接上時由後端覆蓋。
 */
const LEVEL_MULT: Record<string, number> = {
  // ── 細粒度棒球（#6c 後使用） ──
  國小: 0.65,
  國中乙組: 0.78,
  國中甲組: 0.85,
  高中乙組: 0.92,
  高中甲組: 1.0,
  大專乙組: 1.04,
  大專甲組: 1.08,
  成棒: 1.13,
  職業: 1.18,
  // ── 粗粒度棒球（舊報告相容） ──
  國中: 0.85,
  高中: 1.0,
  大學: 1.08,
  // ── 壘球 ──
  慢速壘球: 0.4,
  快速壘球: 0.55,
};

/** 球種數據的 baseline（以高中為基準）*/
const PITCH_BASELINE: Record<string, Record<string, [number, number] | undefined>> = {
  球速: { 四縫線: [135, 4.5], 曲球: [115, 4.0], 滑球: [123, 4.2], 變速球: [120, 4.0] },
  旋轉效率: { 四縫線: [93, 3.0], 曲球: [86, 4.0], 滑球: [70, 4.5], 變速球: [89, 3.5] },
  陀螺角度: { 四縫線: [6, 2.0], 曲球: [40, 5.0], 滑球: [55, 5.0], 變速球: [9, 3.0] },
  轉速: { 四縫線: [2200, 150], 曲球: [2500, 180], 滑球: [2300, 160], 變速球: [1800, 140] },
  垂直位移: { 四縫線: [40, 4.5], 曲球: [-30, 5.0], 滑球: [17, 3.5], 變速球: [33, 4.0] },
  水平位移: { 四縫線: [-17, 3.5], 曲球: [11, 3.5], 滑球: [-5, 2.5], 變速球: [-21, 3.5] },
  出手延伸: { 四縫線: [180, 6.0], 曲球: [178, 6.0], 滑球: [179, 6.0], 變速球: [180, 6.0] },
  出手高度: { 四縫線: [175, 6.0], 曲球: [173, 6.0], 滑球: [174, 6.0], 變速球: [175, 6.0] },
  出手側向: { 四縫線: [50, 5.0], 曲球: [47, 5.0], 滑球: [49, 5.0], 變速球: [50, 5.0] },
  垂直進壘角度: { 四縫線: [-5, 1.2], 曲球: [-7, 1.5], 滑球: [-5.5, 1.3], 變速球: [-5.2, 1.3] },
  水平進壘角度: { 四縫線: [1, 1.0], 曲球: [-2.5, 1.2], 滑球: [-1.8, 1.0], 變速球: [0.5, 1.0] },
};

/** 揮臂數據的 baseline（以高中為基準）*/
const ARM_BASELINE: Record<string, Record<string, [number, number] | undefined>> = {
  揮臂速度: { 四縫線: [4700, 250], 曲球: [4400, 240], 滑球: [4500, 240], 變速球: [4650, 250] },
  出手角度: { 四縫線: [42, 2.5], 曲球: [42.5, 2.5], 滑球: [42, 2.5], 變速球: [42, 2.5] },
  手肘外翻應力: { 四縫線: [62, 5.0], 曲球: [56, 4.5], 滑球: [60, 5.0], 變速球: [61, 5.0] },
  投球效率: { 四縫線: [2.0, 0.15], 曲球: [1.95, 0.15], 滑球: [1.95, 0.15], 變速球: [1.85, 0.15] },
};

/** 取得指定層級的 (avg, sd)，依 LEVEL_MULT 對 baseline 乘倍率 */
const getLevelStats = (
  table: Record<string, Record<string, [number, number] | undefined>>,
  metricLabel: string,
  pitchType: string,
  level: LevelBaseline
): [number, number] | null => {
  const baseline = table[metricLabel]?.[pitchType];
  if (!baseline) return null;
  // 找不到對應層級時 fallback 到 1.0（高中甲組）避免顯示空白
  const mult = LEVEL_MULT[level] ?? 1.0;
  return [baseline[0] * mult, baseline[1]];
};

const mockPitchMetrics: PitchTypeMetric[] = [
  { label: "球速", unit: "kph", values: { 四縫線: { value: 138.5, prevs: [135.2, 133.0] }, 曲球: { value: 118.3, prevs: [116.0, 114.5] }, 滑球: { value: 125.7, prevs: [123.5, 121.8] }, 變速球: { value: 122.1, prevs: [120.8, 119.5] } }, decimals: 1, dataSource: "Velo_Rapsodo" },
  { label: "旋轉方向", values: { 四縫線: { value: "12:15" }, 曲球: { value: "7:30" }, 滑球: { value: "9:45" }, 變速球: { value: "1:00" } }, dataSource: "SpinDirection" },
  { label: "旋轉效率", unit: "%", values: { 四縫線: { value: 95.2, prevs: [94.8, 94.1] }, 曲球: { value: 88.5, prevs: [87.2, 86.0] }, 滑球: { value: 72.3, prevs: [71.0, 69.5] }, 變速球: { value: 91.5, prevs: [90.2, 89.0] } }, decimals: 1, dataSource: "SpinEfficiency" },
  { label: "陀螺角度", unit: "°", values: { 四縫線: { value: 5.2 }, 曲球: { value: 42.5 }, 滑球: { value: 55.3 }, 變速球: { value: 8.1 } }, decimals: 1, dataSource: "GyroDegree" },
  { label: "轉速", unit: "rpm", values: { 四縫線: { value: 2250, prevs: [2200, 2150], sd: 85 }, 曲球: { value: 2580, prevs: [2530, 2480], sd: 92 }, 滑球: { value: 2380, prevs: [2340, 2290], sd: 78 }, 變速球: { value: 1820, prevs: [1790, 1750], sd: 65 } }, decimals: 0, showSD: true, dataSource: "TotalSpin" },
  { label: "垂直位移", unit: "cm", values: { 四縫線: { value: 42.5, prevs: [41.2, 39.8], sd: 3.2 }, 曲球: { value: -32.1, prevs: [-31.5, -30.8], sd: 4.1 }, 滑球: { value: 18.3, prevs: [17.8, 17.0], sd: 2.8 }, 變速球: { value: 35.2, prevs: [34.5, 33.5], sd: 3.5 } }, decimals: 1, showSD: true, dataSource: "VerticalBreak" },
  { label: "水平位移", unit: "cm", values: { 四縫線: { value: -18.5, prevs: [-17.8, -17.0], sd: 2.5 }, 曲球: { value: 12.3, prevs: [11.5, 10.8], sd: 3.0 }, 滑球: { value: -5.2, prevs: [-4.8, -4.2], sd: 1.8 }, 變速球: { value: -22.1, prevs: [-21.5, -20.8], sd: 2.2 } }, decimals: 1, showSD: true, dataSource: "HorizontalBreak" },
  { label: "出手延伸", unit: "cm", values: { 四縫線: { value: 185.2, prevs: [184.5, 183.8] }, 曲球: { value: 182.3, prevs: [181.8, 181.0] }, 滑球: { value: 183.5, prevs: [183.0, 182.5] }, 變速球: { value: 184.8, prevs: [184.2, 183.5] } }, decimals: 1, dataSource: "ReleaseExtension" },
  { label: "出手高度", unit: "cm", values: { 四縫線: { value: 178.5, prevs: [178.2, 177.8] }, 曲球: { value: 176.3, prevs: [176.0, 175.5] }, 滑球: { value: 177.5, prevs: [177.2, 176.8] }, 變速球: { value: 178.0, prevs: [177.8, 177.2] } }, decimals: 1, dataSource: "ReleaseHeight" },
  { label: "出手側向", unit: "cm", values: { 四縫線: { value: 52.3, prevs: [52.0, 51.8] }, 曲球: { value: 48.5, prevs: [48.2, 47.8] }, 滑球: { value: 50.1, prevs: [49.8, 49.5] }, 變速球: { value: 51.5, prevs: [51.2, 50.8] } }, decimals: 1, dataSource: "ReleaseSide" },
  { label: "垂直進壘角度", unit: "°", values: { 四縫線: { value: -4.8, prevs: [-5.0, -5.2] }, 曲球: { value: -7.2, prevs: [-7.5, -7.8] }, 滑球: { value: -5.5, prevs: [-5.8, -6.0] }, 變速球: { value: -5.1, prevs: [-5.3, -5.5] } }, decimals: 1, dataSource: "VAA" },
  { label: "水平進壘角度", unit: "°", values: { 四縫線: { value: 1.2, prevs: [1.0, 0.8] }, 曲球: { value: -2.5, prevs: [-2.8, -3.0] }, 滑球: { value: -1.8, prevs: [-2.0, -2.2] }, 變速球: { value: 0.8, prevs: [0.5, 0.2] } }, decimals: 1, dataSource: "HAA" },
];

const mockArmMetrics: PitchTypeMetric[] = [
  { label: "揮臂速度", unit: "°/s", values: { 四縫線: { value: 4850, prevs: [4780, 4700] }, 曲球: { value: 4520, prevs: [4480, 4420] }, 滑球: { value: 4650, prevs: [4600, 4540] }, 變速球: { value: 4780, prevs: [4730, 4680] } }, decimals: 0, dataSource: "ArmSpeed" },
  { label: "出手角度", unit: "°", values: { 四縫線: { value: 42.5, prevs: [42.0, 41.8] }, 曲球: { value: 43.2, prevs: [42.8, 42.5] }, 滑球: { value: 42.8, prevs: [42.5, 42.2] }, 變速球: { value: 42.3, prevs: [42.0, 41.8] } }, decimals: 1, dataSource: "ReleaseAngle" },
  { label: "手肘外翻應力", unit: "Nm", values: { 四縫線: { value: 65.2, prevs: [64.5, 63.8] }, 曲球: { value: 58.3, prevs: [57.8, 57.2] }, 滑球: { value: 62.1, prevs: [61.5, 60.8] }, 變速球: { value: 63.5, prevs: [63.0, 62.5] } }, decimals: 1, dataSource: "ElbowTorque" },
  { label: "投球效率", values: { 四縫線: { value: 2.12, prevs: [2.08, 2.05] }, 曲球: { value: 2.03, prevs: [2.00, 1.98] }, 滑球: { value: 2.02, prevs: [1.98, 1.95] }, 變速球: { value: 1.92, prevs: [1.88, 1.85] } }, decimals: 2, formula: "Velo_Rapsodo / ElbowTorque（球速 ÷ 外翻應力）", dataSource: "Velo_Rapsodo, ElbowTorque" },
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
  /** 學員 ID — 有值時使用該學員專屬 mock 數據 */
  studentId?: string;
  /** 層級基準標籤（用於最後一欄「{levelLabel}平均 ± 0.5SD」），預設高中 */
  levelLabel?: LevelBaseline;
}

const PitchTypeSection = ({ previousCount = 0, singlePitchType, studentId, levelLabel = "高中甲組" }: PitchTypeSectionProps) => {
  const displayTypes = singlePitchType ? [singlePitchType] : allPitchTypes;
  const isSingle = displayTypes.length === 1;
  const prevCols = Array.from({ length: Math.max(0, previousCount) }, (_, i) => i);

  const renderTable = (
    title: string,
    metrics: PitchTypeMetric[],
    baselineTable: Record<string, Record<string, [number, number] | undefined>>
  ) => (
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
                  colSpan={1 + prevCols.length + 1}
                >
                  {isSingle ? displayTypes[0] : pt}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border/50 bg-muted/20">
              <th></th>
              {displayTypes.flatMap((pt) => [
                <th key={`${pt}-cur-h`} className="text-center py-1 px-3 text-[10px] text-muted-foreground font-normal">當次</th>,
                ...prevCols.map((n) => (
                  <th key={`${pt}-prev-h-${n}`} className="text-center py-1 px-3 text-[10px] text-muted-foreground font-normal">
                    前 {n + 1} 次
                  </th>
                )),
                <th key={`${pt}-level-h`} className="text-center py-1 px-3 text-[10px] text-muted-foreground font-normal">
                  {levelLabel}平均 ± 0.5SD
                </th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {metrics.map((row) => {
              const description = getMetricDescription(row.label);
              const hasTooltip = !!description;
              return (
              <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20">
                <td className="py-2 px-3 text-foreground">
                  <span className="inline-flex items-center gap-1">
                    {row.label}
                    {row.unit && (
                      <span className="text-[10px] text-muted-foreground">({row.unit})</span>
                    )}
                    {hasTooltip && (
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-muted-foreground/60 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs">
                            {description}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </span>
                </td>
                {displayTypes.flatMap((pt) => {
                  const cell = row.values[pt];
                  // 取得該球種、該指標的層級平均（mock）
                  const stats = getLevelStats(baselineTable, row.label, pt, levelLabel);
                  const levelCell = stats
                    ? `${fmt(stats[0], row.decimals)} ± ${fmt(0.5 * stats[1], row.decimals)}`
                    : "—";

                  if (!cell) {
                    return [
                      <td key={`${pt}-cur-${row.label}`} className="py-2 px-3 text-center">—</td>,
                      ...prevCols.map((n) => (
                        <td key={`${pt}-prev-${row.label}-${n}`} className="py-2 px-3 text-center">—</td>
                      )),
                      <td key={`${pt}-level-${row.label}`} className="py-2 px-3 text-center text-muted-foreground text-xs">
                        {levelCell}
                      </td>,
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

                  const displayValue = row.showSD && cell.sd != null && typeof cell.value === "number"
                    ? `${fmt(cell.value, row.decimals)} ± ${fmt(cell.sd, row.decimals)}`
                    : fmt(cell.value, row.decimals);

                  return [
                    <td key={`${pt}-cur-${row.label}`} className="py-2 px-3 text-center font-medium">
                      {displayValue}
                      {arrow}
                    </td>,
                    ...prevCols.map((n) => (
                      <td key={`${pt}-prev-${row.label}-${n}`} className="py-2 px-3 text-center text-muted-foreground text-xs">
                        {fmt(cell.prevs?.[n], row.decimals)}
                      </td>
                    )),
                    <td key={`${pt}-level-${row.label}`} className="py-2 px-3 text-center text-muted-foreground text-xs">
                      {levelCell}
                    </td>,
                  ];
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const pitchData = studentId ? getPitchMockMetrics(studentId) : mockPitchMetrics;
  const armData = studentId ? getArmMockMetrics(studentId) : mockArmMetrics;

  return (
    <>
      {renderTable("球種數據", pitchData, PITCH_BASELINE)}
      {renderTable("揮臂數據", armData, ARM_BASELINE)}
    </>
  );
};

export default PitchTypeSection;
