import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MetricDefinition } from "@/data/metricDefinitions";
import { getMetricDescription } from "@/data/metricDescriptions";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

/** 投球指標值：每個 metric key 底下依球種分欄 */
export interface ComparisonPitchValue {
  key: string;
  value: number | string | null;
  sd?: number | null;
  n?: number;
}

interface ComparisonPitchTableProps {
  title: string;
  metrics: MetricDefinition[];
  /** A 的值，key 格式 = `${metricKey}` (已經依照 selectedPitchType 篩好) */
  valuesA: ComparisonPitchValue[];
  valuesB: ComparisonPitchValue[];
  labelA: string;
  labelB: string;
  pitchType: string;
  /** 是否顯示 PR 欄（A=個人 且 B=群體 才為 true） */
  showPR?: boolean;
  /** key → PR 值（0-100） */
  prMap?: Map<string, number>;
}

// ═══════════════════════════════════════
// Helpers
// ═══════════════════════════════════════
const fmt = (v: number | string | null | undefined, decimals = 1): string => {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  return v.toFixed(decimals);
};

const fmtCell = (cv: ComparisonPitchValue | undefined, decimals = 1): string => {
  if (!cv || cv.value == null) return "—";
  if (typeof cv.value === "string") return cv.value;
  const base = fmt(cv.value, decimals);
  if (cv.sd != null) return `${base} ± ${fmt(cv.sd, decimals)}`;
  return base;
};

const fmtSuffix = (cv: ComparisonPitchValue | undefined): string => {
  if (!cv || cv.n == null) return "";
  return ` (N=${cv.n})`;
};

const calcDiff = (
  a: ComparisonPitchValue | undefined,
  b: ComparisonPitchValue | undefined
): number | null => {
  if (!a || !b) return null;
  if (a.value == null || b.value == null) return null;
  if (typeof a.value === "string" || typeof b.value === "string") return null;
  return a.value - b.value;
};

const getDiffColor = (diff: number | null, reversed?: boolean): string => {
  if (diff == null || diff === 0) return "";
  const aBetter = reversed ? diff < 0 : diff > 0;
  return aBetter
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
};

// ═══════════════════════════════════════
// Component
// ═══════════════════════════════════════
const ComparisonPitchTable = ({
  title,
  metrics,
  valuesA,
  valuesB,
  labelA,
  labelB,
  pitchType,
  showPR = false,
  prMap,
}: ComparisonPitchTableProps) => {
  const mapA = new Map(valuesA.map((v) => [v.key, v]));
  const mapB = new Map(valuesB.map((v) => [v.key, v]));

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted-foreground">— {pitchType}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left py-2 px-3 font-medium text-muted-foreground w-[30%]">
                參數
              </th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                {labelA}
              </th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground">
                {labelB}
              </th>
              <th className="text-center py-2 px-3 font-medium text-muted-foreground w-[15%]">
                差異
              </th>
              {showPR && (
                <th className="text-center py-2 px-3 font-medium text-muted-foreground w-[10%]">
                  PR
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const a = mapA.get(m.key);
              const b = mapB.get(m.key);
              const diff = calcDiff(a, b);
              const diffColor = getDiffColor(diff, m.reversed);
              const description = getMetricDescription(m.label);
              const hasTooltip = !!description;

              return (
                <tr key={m.key} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="py-2 px-3 text-foreground">
                    <span className="inline-flex items-center gap-1">
                      {m.label}
                      {m.unit && (
                        <span className="text-[10px] text-muted-foreground">({m.unit})</span>
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
                  <td className="py-2 px-3 text-center font-medium">
                    {fmtCell(a, m.decimals)}
                    <span className="text-[10px] text-muted-foreground">{fmtSuffix(a)}</span>
                  </td>
                  <td className="py-2 px-3 text-center font-medium">
                    {fmtCell(b, m.decimals)}
                    <span className="text-[10px] text-muted-foreground">{fmtSuffix(b)}</span>
                  </td>
                  <td className={cn("py-2 px-3 text-center font-medium tabular-nums", diffColor)}>
                    {diff != null
                      ? `${diff > 0 ? "+" : ""}${fmt(diff, m.decimals)}`
                      : "—"}
                  </td>
                  {showPR && (
                    <td className="py-2 px-3 text-center font-medium tabular-nums">
                      {prMap?.has(m.key) ? prMap.get(m.key) : "—"}
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

export default ComparisonPitchTable;
