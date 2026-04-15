import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartControls, ChartFilters } from "../chartControlsContext";
import PitchTypeToggleRow, { togglePitchType, pitchLabel } from "./PitchTypeToggleRow";

const pitchMetrics = [
  { value: "velocity", label: "球速", unit: "MPH" },
  { value: "spin_rate", label: "轉速", unit: "RPM" },
  { value: "spin_eff", label: "旋轉效率", unit: "%" },
  { value: "extension", label: "Extension", unit: "ft" },
  { value: "haa", label: "HAA", unit: "°" },
  { value: "vaa", label: "VAA", unit: "°" },
];

const levels = [
  { key: "personal", label: "個人", color: "#60a5fa" },
  { key: "affiliate", label: "職業", color: "#f87171" },
  { key: "college", label: "大學", color: "#34d399" },
  { key: "highSchool", label: "高中", color: "#fbbf24" },
  { key: "youth", label: "青少棒", color: "#a78bfa" },
];

const metricsConfig: Record<string, { means: number[]; std: number; range: [number, number] }> = {
  velocity: { means: [88, 92, 95, 82, 75], std: 4, range: [65, 105] },
  spin_rate: { means: [2100, 2250, 2350, 1950, 1800], std: 200, range: [1200, 2800] },
  spin_eff: { means: [92, 95, 96, 88, 85], std: 5, range: [70, 100] },
  extension: { means: [5.8, 6.2, 6.5, 5.5, 5.0], std: 0.4, range: [4.0, 7.5] },
  haa: { means: [15, 17, 18, 13, 11], std: 3, range: [5, 25] },
  vaa: { means: [-4.5, -3.8, -3.2, -5.2, -6.0], std: 1.2, range: [-9, 0] },
};

// Spin direction clock mock — hour 可為小數（例：12.33 = 12:20）
const spinClockData = [
  { pitch: "FB", hour: 12.25, color: "#ef4444" }, // 12:15
  { pitch: "CB", hour: 7.67,  color: "#3b82f6" }, // 7:40
  { pitch: "SL", hour: 9.33,  color: "#22c55e" }, // 9:20
  { pitch: "CH", hour: 1.5,   color: "#f59e0b" }, // 1:30
];

/** 將小時數（可為小數）轉為 12 小時制時鐘字串 */
function hourToLabel(h: number): string {
  const normalized = ((h - 1) % 12 + 12) % 12 + 1; // 1~12
  const whole = Math.floor(normalized) === 0 ? 12 : Math.floor(normalized);
  const mins = Math.round((normalized - Math.floor(normalized)) * 60);
  // 處理 59.something 進位 → 下一個小時
  if (mins === 60) {
    const next = (whole % 12) + 1;
    return `${next}:00`;
  }
  return `${whole}:${String(mins).padStart(2, "0")}`;
}

const PitchingDistributionChart = () => {
  const [metric, setMetric] = useState("velocity");
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB", "CB", "SL", "CH"]);
  const toggleType = (t: string) => setActiveTypes((prev) => togglePitchType(prev, t));

  const chartData = useMemo(() => {
    const config = metricsConfig[metric];
    const points = 50;
    const result = [];
    for (let i = 0; i < points; i++) {
      const x = config.range[0] + (i / (points - 1)) * (config.range[1] - config.range[0]);
      const point: Record<string, number> = { x };
      config.means.forEach((mean, idx) => {
        const std = config.std;
        point[levels[idx].key] = Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI));
      });
      result.push(point);
    }
    return result;
  }, [metric]);

  const config = metricsConfig[metric];

  const visibleSpinData = spinClockData.filter((s) => activeTypes.includes(s.pitch));

  return (
    <div className="space-y-3">
      {/* 球種多選 portal 至 header 左側 */}
      <ChartFilters>
        <PitchTypeToggleRow active={activeTypes} onToggle={toggleType} />
      </ChartFilters>
      <ChartControls>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pitchMetrics.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ChartControls>

      <div className="flex gap-4">
        {/* KDE Chart */}
        <div className="flex-1 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 16, right: 24, left: 16, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="x" type="number" domain={config.range} tick={{ fontSize: 10 }} tickCount={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="personal" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} strokeWidth={2} name="個人" />
              <Area type="monotone" dataKey="affiliate" stroke="#f87171" fill="none" strokeWidth={1} strokeDasharray="6 3" name="職業" />
              <Area type="monotone" dataKey="college" stroke="#34d399" fill="none" strokeWidth={1} strokeDasharray="6 3" name="大學" />
              <Area type="monotone" dataKey="highSchool" stroke="#fbbf24" fill="none" strokeWidth={1} strokeDasharray="6 3" name="高中" />
              <Area type="monotone" dataKey="youth" stroke="#a78bfa" fill="none" strokeWidth={1} strokeDasharray="6 3" name="青少棒" />
              {config.means.map((mean, idx) => (
                <ReferenceLine key={idx} x={mean} stroke={levels[idx].color} strokeDasharray="3 3" strokeWidth={1} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spin Clock（旋轉方向：每小時再細分 3 等分 → 36 格） */}
        <div className="w-36 flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground mb-1">旋轉方向</span>
          <svg viewBox="0 0 120 120" className="w-32 h-32">
            {/* 外圓 */}
            <circle cx={60} cy={60} r={54} fill="none" stroke="#555" strokeWidth={1} />
            {/* 36 格細分刻度：每小時分成 3 等份（0 / 20 / 40 分） */}
            {Array.from({ length: 36 }, (_, i) => {
              const hour = i / 3; // 0, 0.33, 0.67, 1, ...
              const angle = ((hour - 3) / 12) * Math.PI * 2;
              const isHour = i % 3 === 0;
              const r1 = isHour ? 48 : 51;
              const r2 = 54;
              const x1 = 60 + Math.cos(angle) * r1;
              const y1 = 60 + Math.sin(angle) * r1;
              const x2 = 60 + Math.cos(angle) * r2;
              const y2 = 60 + Math.sin(angle) * r2;
              return (
                <line
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={isHour ? "#888" : "#555"}
                  strokeWidth={isHour ? 1 : 0.5}
                />
              );
            })}
            {/* 12 個整點數字 */}
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
              const angle = ((h - 3) / 12) * Math.PI * 2;
              const x = 60 + Math.cos(angle) * 42;
              const y = 60 + Math.sin(angle) * 42;
              return (
                <text
                  key={h} x={x} y={y}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fill="#aaa"
                >
                  {h}
                </text>
              );
            })}
            {/* 各球種的平均旋轉方向點 */}
            {visibleSpinData.map((s) => {
              const angle = ((s.hour - 3) / 12) * Math.PI * 2;
              const x = 60 + Math.cos(angle) * 30;
              const y = 60 + Math.sin(angle) * 30;
              // 取中文名首字（速/曲/滑/變）
              const shortZh = pitchLabel(s.pitch).charAt(0);
              return (
                <g key={s.pitch}>
                  <circle cx={x} cy={y} r={7} fill={s.color} opacity={0.9} stroke="white" strokeWidth={1} />
                  <text
                    x={x} y={y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={8} fill="white" fontWeight={700}
                  >
                    {shortZh}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* 各球種平均時鐘讀數 */}
          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9px] w-full">
            {visibleSpinData.map((s) => (
              <div key={`lbl-${s.pitch}`} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="font-medium">{pitchLabel(s.pitch)}</span>
                <span className="text-muted-foreground font-mono">{hourToLabel(s.hour)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px]">
        {levels.map((l) => (
          <span key={l.key} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PitchingDistributionChart;
