import { Badge } from "@/components/ui/badge";

export interface PlayerInfo {
  name: string;
  team: string;
  height?: number;
  weight?: number;
  throwsRL?: string;     // 投：左/右
  batsRL?: string;       // 打：左/右
  testDate: string;
  age?: number;
  level?: string;        // 層級：國中/高中/大學/職業 等
  position?: string;
}

interface PlayerInfoHeaderProps {
  player: PlayerInfo;
  reportType: "打擊" | "投球";
}

const PlayerInfoHeader = ({ player, reportType }: PlayerInfoHeaderProps) => {
  const infoPairs: { label: string; value: string | number | undefined }[] = [
    { label: "姓名", value: player.name },
    { label: "所屬球隊", value: player.team },
    { label: "身高", value: player.height ? `${player.height} cm` : undefined },
    { label: "體重", value: player.weight ? `${player.weight} kg` : undefined },
    { label: "投", value: player.throwsRL },
    { label: "打", value: player.batsRL },
    { label: "測驗日期", value: player.testDate },
    { label: "年齡", value: player.age },
    { label: "層級", value: player.level },
  ];

  return (
    <div className="mb-6">
      {/* 報告類型標籤 */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-foreground">選手個資</h2>
        <Badge
          variant="outline"
          className={
            reportType === "打擊"
              ? "border-green-500/50 text-green-600 dark:text-green-400"
              : "border-blue-500/50 text-blue-600 dark:text-blue-400"
          }
        >
          {reportType}檢測報告
        </Badge>
      </div>

      {/* 個資格 */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-2 bg-muted/30 rounded-lg p-4 border border-border/50">
        {infoPairs
          .filter((p) => p.value != null && p.value !== "")
          .map((p) => (
            <div key={p.label} className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {p.label}
              </span>
              <span className="text-sm font-medium text-foreground">{p.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

export default PlayerInfoHeader;
