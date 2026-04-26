import { cn } from "@/lib/utils";
import { Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  advancedPitchingCheckpoints,
  advancedBattingCheckpoints,
  type AdvancedCheckpointStage,
} from "@/data/advancedMechanicsCheckpoints";

interface AdvancedMechanicsTableProps {
  type: "batting" | "pitching";
}

/**
 * 簡易查核表（AI Coach 動態捕捉自動產生）
 * 投手 / 打擊各 8 項，僅以「好 / 差」二元結果呈現，不顯示複雜公式或數值範圍。
 * 完整版（含實測值與標準區間）由教練上傳資料時使用，由 MechanicsChecklist 負責。
 */
const AdvancedMechanicsTable = ({ type }: AdvancedMechanicsTableProps) => {
  const stages: AdvancedCheckpointStage[] =
    type === "batting" ? advancedBattingCheckpoints : advancedPitchingCheckpoints;
  const title = type === "batting" ? "打擊查核點" : "投手查核點";

  const rows: Array<{
    stageLabel: string | null;
    stageRowSpan: number;
    item: AdvancedCheckpointStage["items"][number];
  }> = [];
  stages.forEach((s) => {
    s.items.forEach((it, idx) => {
      rows.push({
        stageLabel: idx === 0 ? s.stage : null,
        stageRowSpan: idx === 0 ? s.items.length : 0,
        item: it,
      });
    });
  });

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
          AI Coach 動態捕捉 · 簡易版
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border bg-primary/10">
              <th className="text-center py-2 px-3 font-medium text-foreground w-[20%]">階段</th>
              <th className="text-left py-2 px-3 font-medium text-foreground">查核點</th>
              <th className="text-center py-2 px-3 font-medium text-green-600 dark:text-green-400 w-[15%]">好</th>
              <th className="text-center py-2 px-3 font-medium text-red-600 dark:text-red-400 w-[15%]">差</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isGood = r.item.inRange === true;
              return (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                  {r.stageLabel !== null && (
                    <td
                      rowSpan={r.stageRowSpan}
                      className="py-2 px-3 text-center font-medium text-foreground bg-muted/30 align-middle border-r border-border/40"
                    >
                      {r.stageLabel}
                    </td>
                  )}
                  <td className="py-2 px-3 text-foreground">{r.item.label}</td>
                  <td className="py-2 px-3 text-center">
                    {isGood && <CheckCircle2 className={cn("inline w-4 h-4 text-green-500")} />}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {!isGood && <AlertTriangle className={cn("inline w-4 h-4 text-red-500")} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdvancedMechanicsTable;
