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
  /** 第一排（5 欄）：測驗日期 / 姓名 / 年齡 / 身高 / 體重 */
  const rowOne: { label: string; value: string | number | undefined }[] = [
    { label: "測驗日期", value: player.testDate },
    { label: "姓名", value: player.name },
    { label: "年齡", value: player.age },
    { label: "身高", value: player.height ? `${player.height} cm` : undefined },
    { label: "體重", value: player.weight ? `${player.weight} kg` : undefined },
  ];
  /** 第二排（4 欄）：所屬球隊 / 層級 / 投 / 打 */
  const rowTwo: { label: string; value: string | number | undefined }[] = [
    { label: "所屬球隊", value: player.team },
    { label: "層級", value: player.level },
    { label: "投", value: player.throwsRL },
    { label: "打", value: player.batsRL },
  ];

  /** 主標題：日期 + 姓名 + 類型（例：2025-01-17 李明軒 打擊檢測報告） */
  const normalizedDate = (player.testDate || "").replace(/\//g, "-");
  const mainTitle = [normalizedDate, player.name, `${reportType}檢測報告`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mb-6">
      {/* 主標題 */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground tracking-tight">{mainTitle}</h2>
      </div>

      {/* 個資格 */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border/50 space-y-3">
        {/* 第一排 5 欄：測驗日期 / 姓名 / 年齡 / 身高 / 體重 */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-x-6 gap-y-2">
          {rowOne.map((p) => (
            <div key={p.label} className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {p.label}
              </span>
              <span className="text-sm font-medium text-foreground">
                {p.value != null && p.value !== "" ? p.value : "—"}
              </span>
            </div>
          ))}
        </div>
        {/* 第二排 4 欄：所屬球隊 / 層級 / 投 / 打 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
          {rowTwo.map((p) => (
            <div key={p.label} className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {p.label}
              </span>
              <span className="text-sm font-medium text-foreground">
                {p.value != null && p.value !== "" ? p.value : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerInfoHeader;
