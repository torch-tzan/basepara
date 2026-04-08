import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface MetricRow {
  /** 參數名稱 */
  label: string;
  /** 選手當次數值 */
  value: number | string | null;
  /** 前一次檢測數值（向後相容：若未提供 previousValues，則使用此欄位） */
  previousValue?: number | string | null;
  /** 多次前次檢測數值（index 0 = 前一次、index 1 = 前前次、依此類推） */
  previousValues?: (number | string | null)[];
  /** 層級平均值 */
  levelAvg?: number | null;
  /** 層級標準差 */
  levelSD?: number | null;
  /** 單位 */
  unit?: string;
  /** 顯示格式：小數位數 */
  decimals?: number;
  /** 是否反向標示（例如體脂率、觸地時間：越低越好） */
  reversed?: boolean;
  /** 不顯示前一次比較箭頭 */
  hideArrow?: boolean;
  /** 顯示 ± 標準差 */
  showSD?: boolean;
  /** 標準差值（用於 平均±標準差 顯示） */
  sd?: number | null;
}

interface DataTableProps {
  title: string;
  rows: MetricRow[];
  /**
   * 要顯示幾欄「前次檢測」：
   * 0 = 僅本次；1 = 本次 + 前一次；2 = 本次 + 前一次 + 前前次；...
   */
  previousCount?: number;
  /** 是否顯示層級平均欄位 */
  showLevelAvg?: boolean;
  /** 子標題（如：測驗方式、測驗球數） */
  subtitle?: string;
  /** 層級平均基準標籤（如「高中」） */
  levelLabel?: string;
}

/** 格式化數值 */
const fmt = (v: number | string | null | undefined, decimals = 1): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return v.toFixed(decimals);
};

/** 判斷色彩標示（與層級平均比較） */
const getColorClass = (
  value: number | string | null,
  avg: number | null | undefined,
  sd: number | null | undefined,
  reversed?: boolean
): string => {
  if (value == null || avg == null || sd == null || typeof value === "string") return "";
  const threshold = 0.5 * sd;
  const above = value > avg + threshold;
  const below = value < avg - threshold;
  if (reversed) {
    if (below) return "text-green-600 dark:text-green-400";
    if (above) return "text-red-600 dark:text-red-400";
  } else {
    if (above) return "text-green-600 dark:text-green-400";
    if (below) return "text-red-600 dark:text-red-400";
  }
  return "";
};

/** 判斷箭頭方向（僅比對「本次 vs 前一次」，前前次不比對） */
const getArrow = (
  value: number | string | null,
  prev: number | string | null | undefined,
  reversed?: boolean
) => {
  if (value == null || prev == null || typeof value === "string" || typeof prev === "string")
    return null;
  if (value > prev) {
    return reversed ? (
      <ArrowUp className="inline w-3 h-3 text-red-500" />
    ) : (
      <ArrowUp className="inline w-3 h-3 text-green-500" />
    );
  }
  if (value < prev) {
    return reversed ? (
      <ArrowDown className="inline w-3 h-3 text-green-500" />
    ) : (
      <ArrowDown className="inline w-3 h-3 text-red-500" />
    );
  }
  return null;
};

/** 取得第 n 次前次數值（n=0 為前一次） */
const getPrevAt = (row: MetricRow, n: number): number | string | null | undefined => {
  if (row.previousValues && row.previousValues.length > n) return row.previousValues[n];
  if (n === 0 && row.previousValue !== undefined) return row.previousValue;
  return undefined;
};

const PREV_LABELS = ["前一次檢測", "前兩次檢測", "前三次檢測", "前四次檢測"];

const DataTable = ({
  title,
  rows,
  previousCount = 1,
  showLevelAvg = true,
  subtitle,
  levelLabel,
}: DataTableProps) => {
  const prevColumns = Array.from({ length: Math.max(0, previousCount) }, (_, i) => i);

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[30%]">
                參數
              </th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                選手數據
              </th>
              {prevColumns.map((n) => (
                <th
                  key={`prev-head-${n}`}
                  className="text-center py-2 px-3 font-medium text-muted-foreground"
                >
                  {PREV_LABELS[n] || `前 ${n + 1} 次`}
                </th>
              ))}
              {showLevelAvg && (
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                  {levelLabel ? `${levelLabel}平均` : "層級平均"} ± 0.5SD
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const colorClass = getColorClass(
                row.value,
                row.levelAvg,
                row.levelSD,
                row.reversed
              );
              // 箭頭只比對「前一次」(n=0)
              const firstPrev = getPrevAt(row, 0);
              const arrow =
                !row.hideArrow && previousCount > 0
                  ? getArrow(row.value, firstPrev, row.reversed)
                  : null;

              return (
                <tr key={row.label} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-3 text-foreground">
                    {row.label}
                    {row.unit && (
                      <span className="text-[10px] text-muted-foreground ml-1">
                        ({row.unit})
                      </span>
                    )}
                  </td>
                  <td className={cn("py-2 px-3 text-center font-medium", colorClass)}>
                    {fmt(row.value, row.decimals)}
                    {row.showSD && row.sd != null && (
                      <span className="text-muted-foreground text-xs">
                        {" "}± {fmt(row.sd, row.decimals)}
                      </span>
                    )}
                    {arrow && <span className="ml-1">{arrow}</span>}
                  </td>
                  {prevColumns.map((n) => {
                    const prevVal = getPrevAt(row, n);
                    return (
                      <td
                        key={`prev-${row.label}-${n}`}
                        className="py-2 px-3 text-center text-muted-foreground"
                      >
                        {fmt(prevVal, row.decimals)}
                      </td>
                    );
                  })}
                  {showLevelAvg && (
                    <td className="py-2 px-3 text-center text-muted-foreground">
                      {row.levelAvg != null
                        ? `${fmt(row.levelAvg, row.decimals)}${
                            row.levelSD != null
                              ? ` ± ${fmt(0.5 * row.levelSD, row.decimals)}`
                              : ""
                          }`
                        : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
