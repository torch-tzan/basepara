import { cn } from "@/lib/utils";

interface MobilityRow {
  label: string;
  unit?: string;
  dominant: number | null;
  dominantPrevs?: (number | null)[];
  nonDominant: number | null;
  nonDominantPrevs?: (number | null)[];
}

const mockMobilityRows: MobilityRow[] = [
  { label: "軀幹旋轉", unit: "°", dominant: 65.2, dominantPrevs: [63.5, 61.8], nonDominant: 62.8, nonDominantPrevs: [61.0, 59.5] },
  { label: "髖內旋", unit: "°", dominant: 38.5, dominantPrevs: [36.2, 34.8], nonDominant: 42.9, nonDominantPrevs: [40.5, 38.8] },
  { label: "髖外旋", unit: "°", dominant: 45.2, dominantPrevs: [44.0, 42.5], nonDominant: 48.5, nonDominantPrevs: [47.2, 45.8] },
  { label: "肩內旋", unit: "°", dominant: 52.3, dominantPrevs: [50.8, 49.5], nonDominant: 60.8, nonDominantPrevs: [59.5, 58.0] },
  { label: "肩外旋", unit: "°", dominant: 108.5, dominantPrevs: [107.2, 105.8], nonDominant: 105.2, nonDominantPrevs: [104.0, 102.5] },
];

interface RiskFactor {
  label: string;
  value: number;
  prevValues?: number[];
  isRed: boolean;
  definition: string;
}

const PREV_SHORT_LABELS = ["前次", "前兩次", "前三次"];

interface MobilitySectionProps {
  /** 顯示前次欄數（0=僅本次、1=+前次、2=+前兩次） */
  previousCount?: number;
}

const MobilitySection = ({ previousCount = 1 }: MobilitySectionProps) => {
  // Calculate risk factors from mobility data
  const shoulderIR_D = 52.3;
  const shoulderIR_ND = 60.8;
  const shoulderER_D = 108.5;
  const shoulderER_ND = 105.2;
  const hipIR_ND = 42.9;

  const gird = shoulderIR_ND - shoulderIR_D;
  const tam_d = shoulderIR_D + shoulderER_D;
  const tam_nd = shoulderIR_ND + shoulderER_ND;
  const tamDiff = Math.abs(tam_d - tam_nd);

  const riskFactors: RiskFactor[] = [
    {
      label: "肩內旋缺損 (GIRD)",
      value: +gird.toFixed(1),
      prevValues: [22.5, 24.0],
      isRed: gird >= 20,
      definition: "慣用手 IR 比非慣用手少的角度，≥20° 為紅色",
    },
    {
      label: "肩總活動度差異 (TAM)",
      value: +tamDiff.toFixed(1),
      prevValues: [8.4, 9.2],
      isRed: tamDiff > 5,
      definition: "兩側 (IR+ER) 差異絕對值，>5° 為紅色",
    },
    {
      label: "非慣用腳 髖內旋",
      value: hipIR_ND,
      prevValues: [26.2, 25.0],
      isRed: hipIR_ND < 30,
      definition: "<30° 為紅色",
    },
  ];

  const prevColumns = Array.from({ length: Math.max(0, previousCount) }, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* 活動度表格 */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">活動度</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[26%]">參數</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground" colSpan={1 + prevColumns.length}>慣用側</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground" colSpan={1 + prevColumns.length}>非慣用側</th>
              </tr>
              <tr className="border-b border-border/50 bg-muted/20">
                <th></th>
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">當次</th>
                {prevColumns.map((n) => (
                  <th key={`d-prev-h-${n}`} className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">
                    {PREV_SHORT_LABELS[n] || `前 ${n + 1} 次`}
                  </th>
                ))}
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">當次</th>
                {prevColumns.map((n) => (
                  <th key={`nd-prev-h-${n}`} className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">
                    {PREV_SHORT_LABELS[n] || `前 ${n + 1} 次`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockMobilityRows.map((row) => (
                <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-3 text-foreground">
                    {row.label}
                    {row.unit && <span className="text-[10px] text-muted-foreground ml-1">({row.unit})</span>}
                  </td>
                  <td className="py-2 px-3 text-center font-medium">{row.dominant ?? "—"}</td>
                  {prevColumns.map((n) => (
                    <td key={`d-${row.label}-${n}`} className="py-2 px-3 text-center text-muted-foreground">
                      {row.dominantPrevs?.[n] ?? "—"}
                    </td>
                  ))}
                  <td className="py-2 px-3 text-center font-medium">{row.nonDominant ?? "—"}</td>
                  {prevColumns.map((n) => (
                    <td key={`nd-${row.label}-${n}`} className="py-2 px-3 text-center text-muted-foreground">
                      {row.nonDominantPrevs?.[n] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 危險因子評估 */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">危險因子評估</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[40%]">項目</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">評估結果</th>
                {prevColumns.map((n) => (
                  <th key={`risk-prev-h-${n}`} className="text-center py-2 px-3 font-medium text-muted-foreground">
                    {PREV_SHORT_LABELS[n] || `前 ${n + 1} 次`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskFactors.map((rf) => (
                <tr key={rf.label} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-3 text-foreground">{rf.label}</td>
                  <td className={cn(
                    "py-2 px-3 text-center font-bold",
                    rf.isRed ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {rf.value}°
                  </td>
                  {prevColumns.map((n) => (
                    <td key={`risk-${rf.label}-${n}`} className="py-2 px-3 text-center text-muted-foreground">
                      {rf.prevValues?.[n] != null ? `${rf.prevValues[n]}°` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MobilitySection;
