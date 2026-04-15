/**
 * 3.x 出手點散佈圖
 * - X 軸切換：側向/高度、Extension/高度
 * - 顯示模式切換：原始點位 vs 各球種平均值
 * - 下方列出三個維度（側向 / 高度 / Extension）的 pairwise 顯著差異
 *   統計方法：Welch's t-test，門檻 |t| > 2.0（約 p < 0.05，n ≥ 10）
 */

import { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartControls, ChartFilters } from "../chartControlsContext";
import PitchTypeToggleRow, { togglePitchType, pitchLabel } from "./PitchTypeToggleRow";

// ── 球種顏色 ──
const pitchColors: Record<string, string> = {
  FB: "#ef4444",
  CB: "#3b82f6",
  SL: "#22c55e",
  CH: "#f59e0b",
};
const pitchOrder = ["FB", "CB", "SL", "CH"] as const;
type PitchType = (typeof pitchOrder)[number];

// ── Seeded RNG + Gaussian（讓 mock 資料 render 穩定） ──
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function gauss(rng: () => number, m: number, sd: number) {
  const u1 = Math.max(rng(), 1e-6);
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return m + z * sd;
}

// 設計：FB vs CB 高度、延伸差異大；CB vs CH、CB vs SL 側向差異大
interface PitchParams {
  n: number;
  side: [number, number]; // [mean, sd]
  height: [number, number];
  ext: [number, number];
}
const pitchParams: Record<PitchType, PitchParams> = {
  FB: { n: 15, side: [1.25, 0.07], height: [1.82, 0.05], ext: [1.92, 0.05] },
  CB: { n: 12, side: [1.08, 0.07], height: [1.68, 0.06], ext: [1.75, 0.06] },
  SL: { n: 12, side: [1.22, 0.07], height: [1.75, 0.05], ext: [1.88, 0.05] },
  CH: { n: 10, side: [1.20, 0.08], height: [1.78, 0.06], ext: [1.80, 0.06] },
};

// ── 統計 ──
function mean(a: number[]) { return a.reduce((s, x) => s + x, 0) / a.length; }
function variance(a: number[]) {
  const m = mean(a);
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1);
}
/** Welch's t-test 取絕對 t 值 */
function welchT(a: number[], b: number[]) {
  const va = variance(a), vb = variance(b);
  return Math.abs((mean(a) - mean(b)) / Math.sqrt(va / a.length + vb / b.length));
}
const T_THRESHOLD = 2.0; // ≈ p < 0.05 (n ≥ ~10)

const ReleasePointChart = () => {
  const [axis, setAxis] = useState<"side" | "ext">("side");
  const [view, setView] = useState<"raw" | "mean">("raw");
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB", "CB", "SL", "CH"]);
  const toggleType = (t: string) => setActiveTypes((prev) => togglePitchType(prev, t));

  // ── Generate stable data ──
  const samples = useMemo(() => {
    const result: Record<PitchType, { side: number[]; height: number[]; ext: number[] }> = {
      FB: { side: [], height: [], ext: [] },
      CB: { side: [], height: [], ext: [] },
      SL: { side: [], height: [], ext: [] },
      CH: { side: [], height: [], ext: [] },
    };
    pitchOrder.forEach((pt, idx) => {
      const rng = seededRng(42 + idx * 1000);
      const p = pitchParams[pt];
      for (let i = 0; i < p.n; i++) {
        result[pt].side.push(gauss(rng, p.side[0], p.side[1]));
        result[pt].height.push(gauss(rng, p.height[0], p.height[1]));
        result[pt].ext.push(gauss(rng, p.ext[0], p.ext[1]));
      }
    });
    return result;
  }, []);

  // 每球種的平均值
  const means = useMemo(() => {
    const r: Record<PitchType, { side: number; height: number; ext: number }> = {} as never;
    pitchOrder.forEach((pt) => {
      r[pt] = {
        side: mean(samples[pt].side),
        height: mean(samples[pt].height),
        ext: mean(samples[pt].ext),
      };
    });
    return r;
  }, [samples]);

  // Pairwise 顯著差異
  const sigPairs = useMemo(() => {
    const dims: Array<"side" | "height" | "ext"> = ["height", "side", "ext"];
    const dimLabel: Record<string, string> = { side: "左右", height: "高度", ext: "延伸" };
    const out: Record<string, string[]> = { height: [], side: [], ext: [] };
    for (const dim of dims) {
      for (let i = 0; i < pitchOrder.length; i++) {
        for (let j = i + 1; j < pitchOrder.length; j++) {
          const a = pitchOrder[i], b = pitchOrder[j];
          const t = welchT(samples[a][dim], samples[b][dim]);
          if (t > T_THRESHOLD) out[dim].push(`${pitchLabel(a)} / ${pitchLabel(b)}`);
        }
      }
    }
    return { out, dimLabel };
  }, [samples]);

  // Chart 資料
  const xKey = axis === "side" ? "side" : "ext";
  const xDomain: [number, number] = axis === "side" ? [0.8, 1.5] : [1.5, 2.1];
  const xLabel = axis === "side" ? "Release Side (m)" : "Extension (m)";

  const visibleOrder = pitchOrder.filter((pt) => activeTypes.includes(pt));
  const rawData = visibleOrder.map((pt) => ({
    name: pt,
    color: pitchColors[pt],
    points: samples[pt][xKey].map((x, i) => ({ x, y: samples[pt].height[i] })),
  }));
  const meanData = visibleOrder.map((pt) => ({
    name: pt,
    color: pitchColors[pt],
    points: [{ x: means[pt][xKey], y: means[pt].height, z: 200 }],
  }));

  return (
    <div className="space-y-3">
      {/* 球種多選 portal 至 header 左側 */}
      <ChartFilters>
        <PitchTypeToggleRow active={activeTypes} onToggle={toggleType} />
      </ChartFilters>
      <ChartControls>
        <div className="flex items-center gap-2">
          {/* X 軸切換 */}
          <div className="flex gap-1">
            <Button variant={axis === "side" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setAxis("side")}>
              側向/高度
            </Button>
            <Button variant={axis === "ext" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setAxis("ext")}>
              Extension/高度
            </Button>
          </div>
          <span className="text-muted-foreground text-xs">|</span>
          {/* 顯示模式切換 */}
          <div className="flex gap-1">
            <Button variant={view === "raw" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setView("raw")}>
              原始點位
            </Button>
            <Button variant={view === "mean" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setView("mean")}>
              球種平均
            </Button>
          </div>
        </div>
      </ChartControls>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, left: 16, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              type="number"
              dataKey="x"
              domain={xDomain}
              tick={{ fontSize: 10 }}
              label={{ value: xLabel, position: "insideBottom", offset: -12, style: { fontSize: 10 } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[1.55, 1.95]}
              tick={{ fontSize: 10 }}
              label={{ value: "Release Height (m)", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
            />
            {/* 大圓點代表「球種平均」 */}
            <ZAxis type="number" dataKey="z" range={[30, 200]} />
            <Tooltip
              formatter={(value: number, name: string) => [value.toFixed(2), name]}
              cursor={{ strokeDasharray: "3 3" }}
            />
            {(view === "raw" ? rawData : meanData).map((s) => (
              <Scatter
                key={s.name}
                data={s.points}
                fill={s.color}
                opacity={view === "raw" ? 0.55 : 0.95}
                stroke={view === "mean" ? "white" : undefined}
                strokeWidth={view === "mean" ? 1.5 : 0}
                name={pitchLabel(s.name)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* 圖例 + 各球種平均值 */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px]">
        {visibleOrder.map((pt) => (
          <span key={pt} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: pitchColors[pt] }} />
            <span className="font-medium">{pitchLabel(pt)}</span>
            <span className="text-muted-foreground">
              ({means[pt][xKey].toFixed(2)}, {means[pt].height.toFixed(2)})
            </span>
          </span>
        ))}
      </div>

      {/* 顯著差異清單 */}
      <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5">
        <div className="font-semibold text-foreground/90 mb-1">統計顯著差異 (Welch's t-test, |t| &gt; 2.0)</div>
        {(["height", "side", "ext"] as const).map((dim) => {
          const pairs = sigPairs.out[dim];
          return (
            <div key={dim} className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-medium text-foreground/80 shrink-0 whitespace-nowrap">
                {sigPairs.dimLabel[dim]}有顯著差異
              </span>
              {pairs.length === 0 ? (
                <span className="text-muted-foreground">無</span>
              ) : (
                <span className="flex flex-wrap gap-1.5">
                  {pairs.map((pair) => (
                    <span
                      key={pair}
                      className="px-1.5 py-0.5 rounded bg-background border border-border/60 font-mono text-[10px]"
                    >
                      {pair}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReleasePointChart;
