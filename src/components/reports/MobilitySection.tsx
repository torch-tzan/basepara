import { cn } from "@/lib/utils";

interface MobilityRow {
  label: string;
  unit?: string;
  dominant: number | null;
  dominantPrev?: number | null;
  nonDominant: number | null;
  nonDominantPrev?: number | null;
}

const mockMobilityRows: MobilityRow[] = [
  { label: "軀幹旋轉", unit: "°", dominant: 65.2, dominantPrev: 63.5, nonDominant: 62.8, nonDominantPrev: 61.0 },
  { label: "髖內旋", unit: "°", dominant: 38.5, dominantPrev: 36.2, nonDominant: 42.9, nonDominantPrev: 40.5 },
  { label: "髖外旋", unit: "°", dominant: 45.2, dominantPrev: 44.0, nonDominant: 48.5, nonDominantPrev: 47.2 },
  { label: "肩內旋", unit: "°", dominant: 52.3, dominantPrev: 50.8, nonDominant: 60.8, nonDominantPrev: 59.5 },
  { label: "肩外旋", unit: "°", dominant: 108.5, dominantPrev: 107.2, nonDominant: 105.2, nonDominantPrev: 104.0 },
];

interface RiskFactor {
  label: string;
  value: number;
  prevValue?: number;
  isRed: boolean;
  definition: string;
}

const FitnessSection = () => {
  // Calculate risk factors from mobility data
  const shoulderIR_D = 52.3;
  const shoulderIR_ND = 60.8;
  const shoulderER_D = 108.5;
  const shoulderER_ND = 105.2;
  const hipIR_ND = 42.9;

  const gird = shoulderIR_ND - shoulderIR_D; // GIRD
  const tam_d = shoulderIR_D + shoulderER_D;
  const tam_nd = shoulderIR_ND + shoulderER_ND;
  const tamDiff = Math.abs(tam_d - tam_nd);

  const riskFactors: RiskFactor[] = [
    {
      label: "肩內旋缺損 (GIRD)",
      value: +gird.toFixed(1),
      prevValue: 22.5,
      isRed: gird >= 20,
      definition: "慣用手 IR 比非慣用手少的角度，≥20° 為紅色",
    },
    {
      label: "肩總活動度差異 (TAM)",
      value: +tamDiff.toFixed(1),
      prevValue: 8.4,
      isRed: tamDiff > 5,
      definition: "兩側 (IR+ER) 差異絕對值，>5° 為紅色",
    },
    {
      label: "非慣用腳 髖內旋",
      value: hipIR_ND,
      prevValue: 26.2,
      isRed: hipIR_ND < 30,
      definition: "<30° 為紅色",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 活動度表格 */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">活動度</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[30%]">參數</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground" colSpan={2}>慣用側</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground" colSpan={2}>非慣用側</th>
              </tr>
              <tr className="border-b border-border/50 bg-muted/20">
                <th></th>
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">當次</th>
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">前次</th>
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">當次</th>
                <th className="text-center py-1 px-3 text-xs text-muted-foreground font-normal">前次</th>
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
                  <td className="py-2 px-3 text-center text-muted-foreground">{row.dominantPrev ?? "—"}</td>
                  <td className="py-2 px-3 text-center font-medium">{row.nonDominant ?? "—"}</td>
                  <td className="py-2 px-3 text-center text-muted-foreground">{row.nonDominantPrev ?? "—"}</td>
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
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">前一次</th>
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
                  <td className="py-2 px-3 text-center text-muted-foreground">
                    {rf.prevValue != null ? `${rf.prevValue}°` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FitnessSection;
