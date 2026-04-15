/**
 * 4.x 球路位移圖
 * - 三個獨立開關：原始點、平均點、誤差範圍
 * - 誤差範圍為「選擇層級」的誤差範圍（非個人），預設為選手目前層級
 * - 顯示選手的出手角度（取 FB ArmSlot 平均值，四捨五入到整數）
 */

import { useMemo, useState } from "react";
import { ChartControls, ChartFilters } from "../chartControlsContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PitchTypeToggleRow, { togglePitchType, pitchLabel } from "./PitchTypeToggleRow";

// ── 選手目前層級 & FB ArmSlot 平均（來自投球數據表，mock）──
const PLAYER_CURRENT_LEVEL = "college";
const FB_ARM_SLOT_MEAN = 42.3; // 單位：°，真實計算會從 FB 紀錄取 mean

// ── 層級選項 ──
const LEVELS = [
  { value: "personal",    label: "個人" },
  { value: "affiliate",   label: "職業" },
  { value: "college",     label: "大學" },
  { value: "high_school", label: "高中" },
  { value: "youth",       label: "青少棒" },
];

// ── 各層級在各球種上的誤差橢圓大小 (mock) ──
// 真實情境會是該層級多位選手球路位移的標準差
const levelEllipseByPitch: Record<string, Record<string, { rx: number; ry: number }>> = {
  personal:    { FB: { rx: 12, ry: 10 }, CB: { rx: 10, ry: 10 }, SL: { rx: 9, ry: 9 },  CH: { rx: 11, ry: 10 } },
  affiliate:   { FB: { rx: 18, ry: 16 }, CB: { rx: 16, ry: 15 }, SL: { rx: 15, ry: 14 }, CH: { rx: 17, ry: 15 } },
  college:     { FB: { rx: 20, ry: 18 }, CB: { rx: 18, ry: 17 }, SL: { rx: 16, ry: 15 }, CH: { rx: 19, ry: 17 } },
  high_school: { FB: { rx: 26, ry: 24 }, CB: { rx: 24, ry: 22 }, SL: { rx: 22, ry: 20 }, CH: { rx: 25, ry: 22 } },
  youth:       { FB: { rx: 32, ry: 28 }, CB: { rx: 28, ry: 26 }, SL: { rx: 26, ry: 24 }, CH: { rx: 30, ry: 26 } },
};

// ── 球種資料 ──
const pitchTypes = [
  { type: "FB", color: "#ef4444", avgX: 8,   avgY: 16,  rawN: 15, spread: 6 },
  { type: "CB", color: "#3b82f6", avgX: -4,  avgY: -8,  rawN: 15, spread: 5 },
  { type: "SL", color: "#22c55e", avgX: -6,  avgY: 4,   rawN: 15, spread: 4 },
  { type: "CH", color: "#f59e0b", avgX: 12,  avgY: 6,   rawN: 15, spread: 5 },
];

// Seeded RNG 讓 render 穩定
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

const PitchMovementChart = () => {
  const [showAvg, setShowAvg] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [showEllipse, setShowEllipse] = useState(true);
  const [level, setLevel] = useState<string>(PLAYER_CURRENT_LEVEL);
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB", "CB", "SL", "CH"]);
  const toggleType = (t: string) => setActiveTypes((prev) => togglePitchType(prev, t));

  const w = 300, h = 280, cx = w / 2, cy = h / 2;
  const scaleX = (v: number) => cx + v * 7;
  const scaleY = (v: number) => cy - v * 7;

  const pitchesWithPoints = useMemo(() => {
    return pitchTypes.map((pt, idx) => {
      const rng = seeded(1000 + idx * 37);
      const points = Array.from({ length: pt.rawN }, () => ({
        x: pt.avgX + (rng() - 0.5) * pt.spread,
        y: pt.avgY + (rng() - 0.5) * pt.spread,
      }));
      return { ...pt, points };
    });
  }, []);

  const armSlotDeg = Math.round(FB_ARM_SLOT_MEAN);

  const visiblePitches = pitchesWithPoints.filter((pt) => activeTypes.includes(pt.type));

  return (
    <div className="space-y-3">
      {/* 球種多選 portal 至 header 左側 */}
      <ChartFilters>
        <PitchTypeToggleRow active={activeTypes} onToggle={toggleType} />
      </ChartFilters>
      <ChartControls>
        <div className="flex items-center gap-3 flex-wrap">
          {/* 開關：三項 */}
          <div className="flex items-center gap-1.5">
            <Checkbox id="mv-pts" checked={showPoints} onCheckedChange={(c) => setShowPoints(c as boolean)} className="h-3.5 w-3.5" />
            <Label htmlFor="mv-pts" className="text-[10px] cursor-pointer">原始點</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="mv-avg" checked={showAvg} onCheckedChange={(c) => setShowAvg(c as boolean)} className="h-3.5 w-3.5" />
            <Label htmlFor="mv-avg" className="text-[10px] cursor-pointer">平均點</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="mv-ell" checked={showEllipse} onCheckedChange={(c) => setShowEllipse(c as boolean)} className="h-3.5 w-3.5" />
            <Label htmlFor="mv-ell" className="text-[10px] cursor-pointer">誤差範圍</Label>
          </div>

          {/* 層級選擇（誤差範圍用） */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">層級</span>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-7 w-[108px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}{l.value === PLAYER_CURRENT_LEVEL ? "（目前）" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ChartControls>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px] h-auto">
          {/* 十字線 & 刻度 */}
          <line x1={0} y1={cy} x2={w} y2={cy} stroke="#555" strokeWidth={0.5} />
          <line x1={cx} y1={0} x2={cx} y2={h} stroke="#555" strokeWidth={0.5} />
          {[-20, -10, 10, 20].map((v) => (
            <g key={v}>
              <line x1={scaleX(v)} y1={cy - 3} x2={scaleX(v)} y2={cy + 3} stroke="#666" strokeWidth={0.5} />
              <text x={scaleX(v)} y={cy + 12} textAnchor="middle" fontSize={8} fill="#888">{v}</text>
              <line x1={cx - 3} y1={scaleY(v)} x2={cx + 3} y2={scaleY(v)} stroke="#666" strokeWidth={0.5} />
              <text x={cx - 10} y={scaleY(v) + 3} textAnchor="end" fontSize={8} fill="#888">{v}</text>
            </g>
          ))}
          <text x={w - 5} y={cy - 5} textAnchor="end" fontSize={9} fill="#999">HB (in)</text>
          <text x={cx + 5} y={12} fontSize={9} fill="#999">VB (in)</text>

          {/* 出手角度指示線（從原點射出） */}
          {(() => {
            // ArmSlot：從 3 點鐘方向逆時針算的角度（°），右投高於水平線是正值
            // 轉成 SVG 角度：0°=水平向右，角度逆時針遞增 → svg 中 y 是向下為正，所以 y 方向要反向
            const rad = (armSlotDeg * Math.PI) / 180;
            const len = 110;
            const endX = cx + Math.cos(rad) * len;
            const endY = cy - Math.sin(rad) * len;
            return (
              <g>
                <line
                  x1={cx} y1={cy} x2={endX} y2={endY}
                  stroke="#a78bfa" strokeWidth={1.5}
                  strokeDasharray="4 3" opacity={0.85}
                />
                <text
                  x={endX + 4} y={endY - 2}
                  fontSize={9} fill="#c4b5fd" fontWeight={700}
                >
                  出手角度 {armSlotDeg}°
                </text>
              </g>
            );
          })()}

          {/* 每球種資料 */}
          {visiblePitches.map((pt) => {
            const ell = levelEllipseByPitch[level]?.[pt.type];
            return (
              <g key={pt.type}>
                {showEllipse && ell && (
                  <ellipse
                    cx={scaleX(pt.avgX)} cy={scaleY(pt.avgY)}
                    rx={ell.rx} ry={ell.ry}
                    fill={pt.color} fillOpacity={0.08}
                    stroke={pt.color} strokeWidth={1} strokeDasharray="3 2"
                  />
                )}
                {showPoints && pt.points.map((p, i) => (
                  <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill={pt.color} opacity={0.5} />
                ))}
                {showAvg && (
                  <g>
                    <circle
                      cx={scaleX(pt.avgX)} cy={scaleY(pt.avgY)}
                      r={6} fill={pt.color}
                      stroke="white" strokeWidth={1.5}
                    />
                    <text
                      x={scaleX(pt.avgX) + 8} y={scaleY(pt.avgY) - 6}
                      fontSize={9} fontWeight={700} fill={pt.color}
                    >
                      {pitchLabel(pt.type)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px]">
        {pitchTypes.filter((pt) => activeTypes.includes(pt.type)).map((pt) => (
          <span key={pt.type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: pt.color }} />
            {pitchLabel(pt.type)}
          </span>
        ))}
        <span className="flex items-center gap-1 text-muted-foreground">
          <span className="inline-block w-3 border-t border-dashed" style={{ borderColor: "#a78bfa" }} />
          出手角度
        </span>
      </div>
      <div className="text-center text-[10px] text-muted-foreground">
        誤差範圍：{LEVELS.find((l) => l.value === level)?.label}
        {level === PLAYER_CURRENT_LEVEL ? "（選手目前層級）" : ""}
      </div>
    </div>
  );
};

export default PitchMovementChart;
