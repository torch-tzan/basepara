/**
 * 進壘點圖（熱區圖）
 * 我們只紀錄「進壘號碼」而非真實座標，故僅能用熱區圖呈現。
 * 版面：MLB Statcast 13-zone（z1~z9 好球帶 + z11~z14 四個壞球象限）
 * - 色彩：該區的球數（越多越紅）
 * - 預設：單一球種（FB），可透過按鈕加選或切換
 */

import { useMemo, useState } from "react";
import PitchTypeToggleRow, { PITCH_TYPE_OPTIONS, togglePitchType } from "./PitchTypeToggleRow";
import { ChartFilters } from "../chartControlsContext";

const pitchTypeConfig = PITCH_TYPE_OPTIONS;

type ZoneId = "z1" | "z2" | "z3" | "z4" | "z5" | "z6" | "z7" | "z8" | "z9" | "z11" | "z12" | "z13" | "z14";
const ALL_ZONES: ZoneId[] = ["z1","z2","z3","z4","z5","z6","z7","z8","z9","z11","z12","z13","z14"];

// ── 假資料：每個球種在 13 個區域的球數 ──
const mockCountsByPitch: Record<string, Record<ZoneId, number>> = {
  FB: { z1: 3, z2: 12, z3: 5, z4: 8, z5: 20, z6: 10, z7: 2, z8: 6, z9: 4, z11: 8, z12: 7, z13: 3, z14: 4 },
  CB: { z1: 1, z2: 3, z3: 2, z4: 2, z5: 5, z6: 3, z7: 6, z8: 12, z9: 8, z11: 1, z12: 2, z13: 5, z14: 6 },
  SL: { z1: 2, z2: 4, z3: 8, z4: 3, z5: 6, z6: 14, z7: 2, z8: 3, z9: 7, z11: 1, z12: 5, z13: 2, z14: 8 },
  CH: { z1: 2, z2: 5, z3: 3, z4: 6, z5: 10, z6: 4, z7: 8, z8: 6, z9: 3, z11: 3, z12: 2, z13: 4, z14: 3 },
};

// ── 色階：低 → 白、高 → 紅 ──
function getHeatColor(count: number, min: number, max: number): string {
  if (max === min) return "rgb(230,230,230)";
  const t = Math.max(0, Math.min(1, (count - min) / (max - min)));
  // 低 → 淡藍、中 → 淺灰白、高 → 紅
  if (t < 0.5) {
    const k = t / 0.5;
    const r = Math.round(130 + k * 110);
    const g = Math.round(170 + k * 70);
    const b = Math.round(230 - k * 5);
    return `rgb(${r}, ${g}, ${b})`;
  }
  const k = (t - 0.5) / 0.5;
  const r = Math.round(240 + k * 0);
  const g = Math.round(240 - k * 160);
  const b = Math.round(225 - k * 155);
  return `rgb(${r}, ${g}, ${b})`;
}

const PitchLocationChart = () => {
  // 預設只顯示 FB
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB"]);

  const toggleType = (t: string) => setActiveTypes((prev) => togglePitchType(prev, t));

  // 合併選取球種的球數（逐區相加）
  const zoneCounts = useMemo(() => {
    const sum: Record<ZoneId, number> = {
      z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0, z8: 0, z9: 0,
      z11: 0, z12: 0, z13: 0, z14: 0,
    };
    activeTypes.forEach((pt) => {
      const src = mockCountsByPitch[pt];
      ALL_ZONES.forEach((z) => { sum[z] += src[z]; });
    });
    return sum;
  }, [activeTypes]);

  const values = ALL_ZONES.map((z) => zoneCounts[z]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const total = values.reduce((s, v) => s + v, 0);

  // ── Layout ──
  const totalW = 300;
  const totalH = 320;
  const szW = 168;
  const szH = 204;
  const szX = (totalW - szW) / 2;
  const szY = (totalH - szH) / 2;
  const cellW = szW / 3;
  const cellH = szH / 3;
  const cx = totalW / 2;
  const cy = totalH / 2;

  const innerZones: { id: ZoneId; row: number; col: number }[] = [
    { id: "z1", row: 0, col: 0 }, { id: "z2", row: 0, col: 1 }, { id: "z3", row: 0, col: 2 },
    { id: "z4", row: 1, col: 0 }, { id: "z5", row: 1, col: 1 }, { id: "z6", row: 1, col: 2 },
    { id: "z7", row: 2, col: 0 }, { id: "z8", row: 2, col: 1 }, { id: "z9", row: 2, col: 2 },
  ];

  const outerZones: { id: ZoneId; x: number; y: number; w: number; h: number; lx: number; ly: number }[] = [
    { id: "z11", x: 0,  y: 0,  w: cx,          h: cy,           lx: szX / 2,           ly: szY / 2 },
    { id: "z12", x: cx, y: 0,  w: totalW - cx, h: cy,           lx: totalW - szX / 2,  ly: szY / 2 },
    { id: "z13", x: 0,  y: cy, w: cx,          h: totalH - cy,  lx: szX / 2,           ly: totalH - szY / 2 },
    { id: "z14", x: cx, y: cy, w: totalW - cx, h: totalH - cy,  lx: totalW - szX / 2,  ly: totalH - szY / 2 },
  ];

  return (
    <div className="space-y-3">
      {/* 球種切換按鈕 portal 至 header 左側，與右側控制項同高 */}
      <ChartFilters>
        <PitchTypeToggleRow active={activeTypes} onToggle={toggleType} />
      </ChartFilters>

      <div className="flex items-center justify-center gap-4">
        <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[300px] h-auto">
          {/* 壞球區 4 象限 */}
          {outerZones.map((z) => {
            const val = zoneCounts[z.id];
            return (
              <g key={z.id}>
                <rect
                  x={z.x} y={z.y} width={z.w} height={z.h}
                  fill={getHeatColor(val, min, max)}
                  opacity={0.75}
                  stroke="rgba(71,85,105,0.9)" strokeWidth={1}
                />
                <text
                  x={z.lx} y={z.ly}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={14} fontWeight={600} fill="#1e293b"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 好球帶 3x3 */}
          {innerZones.map((z) => {
            const x = szX + z.col * cellW;
            const y = szY + z.row * cellH;
            const val = zoneCounts[z.id];
            return (
              <g key={z.id}>
                <rect
                  x={x} y={y} width={cellW} height={cellH}
                  fill={getHeatColor(val, min, max)}
                  opacity={0.95}
                  stroke="rgba(71,85,105,0.9)" strokeWidth={1}
                />
                <text
                  x={x + cellW / 2} y={y + cellH / 2}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={15} fontWeight={700} fill="#1e293b"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 好球帶外框 */}
          <rect
            x={szX} y={szY} width={szW} height={szH}
            fill="none" stroke="#0f172a" strokeWidth={2.4}
          />
        </svg>

        {/* 右側色階 */}
        <div className="flex flex-col items-center text-[10px] text-muted-foreground">
          <span className="mb-1">{max} 球</span>
          <div
            className="w-3 h-36 rounded-sm border border-border/60"
            style={{
              background: `linear-gradient(to bottom,
                ${getHeatColor(max, min, max)},
                ${getHeatColor((max + min) / 2, min, max)},
                ${getHeatColor(min, min, max)})`,
            }}
          />
          <span className="mt-1">{min} 球</span>
        </div>
      </div>

      {/* 底部說明 */}
      <div className="text-center text-[11px] text-muted-foreground">
        顯示球種：{activeTypes.map((t) => pitchTypeConfig.find((p) => p.type === t)?.label ?? t).join(" + ")}　總球數：{total}
      </div>
    </div>
  );
};

export default PitchLocationChart;
