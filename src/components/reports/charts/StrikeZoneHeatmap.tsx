/**
 * 好球帶熱區圖
 * 指標（都是數值越高越好）：
 *  - exit_velo            擊球初速 (km/h)
 *  - hard_hit_rate        強擊球率 (%)
 *  - eff_la_rate          有效仰角比例 (%)
 *  - eff_la_hard_hit_rate 有效仰角且強擊球比例 (%)
 *
 * 版面採 MLB Statcast 13-zone：
 *  - 內框 3x3（strike zone）編號 z1~z9
 *  - 外框 4 個象限（壞球區）：以 strike zone 中心為十字切分
 *    z11 左上、z12 右上、z13 左下、z14 右下
 */

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartControls } from "../chartControlsContext";

const metrics = [
  { value: "exit_velo", label: "擊球初速", unit: "km/h", format: (v: number) => v.toFixed(0) },
  { value: "hard_hit_rate", label: "強擊球率", unit: "%", format: (v: number) => v.toFixed(0) },
  { value: "eff_la_rate", label: "有效仰角比例", unit: "%", format: (v: number) => v.toFixed(0) },
  { value: "eff_la_hard_hit_rate", label: "有效仰角且強擊球比例", unit: "%", format: (v: number) => v.toFixed(0) },
];

type ZoneId = "z1" | "z2" | "z3" | "z4" | "z5" | "z6" | "z7" | "z8" | "z9" | "z11" | "z12" | "z13" | "z14";

// 模擬資料（所有指標數值越高越好）
const mockData: Record<string, Record<ZoneId, number>> = {
  exit_velo: {
    z1: 138, z2: 145, z3: 132,
    z4: 150, z5: 155, z6: 142,
    z7: 128, z8: 135, z9: 122,
    z11: 110, z12: 105, z13: 98, z14: 102,
  },
  hard_hit_rate: {
    z1: 38, z2: 52, z3: 35,
    z4: 55, z5: 68, z6: 48,
    z7: 30, z8: 42, z9: 28,
    z11: 18, z12: 15, z13: 10, z14: 12,
  },
  eff_la_rate: {
    z1: 42, z2: 55, z3: 40,
    z4: 60, z5: 72, z6: 52,
    z7: 35, z8: 48, z9: 32,
    z11: 22, z12: 20, z13: 15, z14: 18,
  },
  eff_la_hard_hit_rate: {
    z1: 25, z2: 38, z3: 22,
    z4: 42, z5: 55, z6: 35,
    z7: 18, z8: 28, z9: 15,
    z11: 8, z12: 6, z13: 4, z14: 5,
  },
};

/**
 * 以固定色帶（冷藍 → 暖紅）依 t∈[0,1] 取色。
 * 統一用「越高越紅」的方向，因為所有指標都是越高越好。
 */
function getColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
  // 低 → 淡藍；高 → 鮮紅
  if (t < 0.5) {
    const k = t / 0.5; // 0~1
    const r = Math.round(130 + k * 90);
    const g = Math.round(170 + k * 60);
    const b = Math.round(230 - k * 10);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const k = (t - 0.5) / 0.5; // 0~1
    const r = Math.round(220 + k * 20);
    const g = Math.round(230 - k * 150);
    const b = Math.round(220 - k * 150);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

const StrikeZoneHeatmap = () => {
  const [metric, setMetric] = useState("exit_velo");
  const data = mockData[metric];
  const meta = metrics.find((m) => m.value === metric)!;
  const values = Object.values(data);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // ── Layout（SVG 以 viewBox 單位）──
  const totalW = 300;
  const totalH = 320;
  const szW = 168;   // 好球帶寬
  const szH = 204;   // 好球帶高
  const szX = (totalW - szW) / 2;
  const szY = (totalH - szH) / 2;
  const cellW = szW / 3;
  const cellH = szH / 3;
  const cx = totalW / 2; // 十字切分中心 = 好球帶正中心
  const cy = totalH / 2;

  const innerZones: { id: ZoneId; row: number; col: number }[] = [
    { id: "z1", row: 0, col: 0 }, { id: "z2", row: 0, col: 1 }, { id: "z3", row: 0, col: 2 },
    { id: "z4", row: 1, col: 0 }, { id: "z5", row: 1, col: 1 }, { id: "z6", row: 1, col: 2 },
    { id: "z7", row: 2, col: 0 }, { id: "z8", row: 2, col: 1 }, { id: "z9", row: 2, col: 2 },
  ];

  // 4 個外側象限：以 (cx, cy) 為十字中心，向 4 個角落延伸到整個外框
  const outerZones: { id: ZoneId; x: number; y: number; w: number; h: number; labelX: number; labelY: number }[] = [
    // z11 左上
    { id: "z11", x: 0,   y: 0,   w: cx,        h: cy,        labelX: szX / 2,              labelY: szY / 2 },
    // z12 右上
    { id: "z12", x: cx,  y: 0,   w: totalW-cx, h: cy,        labelX: totalW - szX / 2,     labelY: szY / 2 },
    // z13 左下
    { id: "z13", x: 0,   y: cy,  w: cx,        h: totalH-cy, labelX: szX / 2,              labelY: totalH - szY / 2 },
    // z14 右下
    { id: "z14", x: cx,  y: cy,  w: totalW-cx, h: totalH-cy, labelX: totalW - szX / 2,     labelY: totalH - szY / 2 },
  ];

  return (
    <div className="space-y-3">
      <ChartControls>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ChartControls>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[300px] h-auto">
          {/* 外側 4 個象限（壞球區），以十字切分 */}
          {outerZones.map((z) => {
            const val = data[z.id];
            return (
              <g key={z.id}>
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  fill={getColor(val, min, max)}
                  opacity={0.65}
                  stroke="rgba(71,85,105,0.9)"
                  strokeWidth={1}
                />
                <text
                  x={z.labelX}
                  y={z.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={14}
                  fontWeight={600}
                  fill="#1e293b"
                >
                  {meta.format(val)}
                </text>
              </g>
            );
          })}

          {/* 好球帶內側 3x3（畫在外側象限之上，遮住重疊區） */}
          {innerZones.map((z) => {
            const x = szX + z.col * cellW;
            const y = szY + z.row * cellH;
            const val = data[z.id];
            return (
              <g key={z.id}>
                <rect
                  x={x}
                  y={y}
                  width={cellW}
                  height={cellH}
                  fill={getColor(val, min, max)}
                  opacity={0.9}
                  stroke="rgba(71,85,105,0.9)"
                  strokeWidth={1}
                />
                <text
                  x={x + cellW / 2}
                  y={y + cellH / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={15}
                  fontWeight={700}
                  fill="#1e293b"
                >
                  {meta.format(val)}
                </text>
              </g>
            );
          })}

          {/* 好球帶外框加粗強調 */}
          <rect
            x={szX}
            y={szY}
            width={szW}
            height={szH}
            fill="none"
            stroke="#0f172a"
            strokeWidth={2.4}
          />
        </svg>
      </div>

      {/* 色階圖例：低 → 高 */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span>低</span>
        <div className="flex h-3">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="w-4 h-full"
              style={{ backgroundColor: getColor(min + (i / 11) * (max - min), min, max) }}
            />
          ))}
        </div>
        <span>高</span>
        <span className="ml-2">單位：{meta.unit}</span>
      </div>
    </div>
  );
};

export default StrikeZoneHeatmap;
