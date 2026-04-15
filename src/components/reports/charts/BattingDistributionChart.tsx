import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartControls } from "../chartControlsContext";

const metrics = [
  { value: "swing_speed", label: "揮棒速度", unit: "km/h" },
  { value: "attack_angle", label: "攻擊角度", unit: "°" },
  { value: "swing_time", label: "揮擊時間", unit: "s" },
  { value: "exit_velo", label: "擊球初速", unit: "MPH" },
  { value: "launch_angle", label: "擊球仰角", unit: "°" },
  { value: "top20_la", label: "前20%強擊球仰角", unit: "°" },
  { value: "smash_factor", label: "擊球品質", unit: "" },
];

const levels = [
  { key: "personal", label: "個人", color: "#60a5fa", mean: 0 },
  { key: "affiliate", label: "職業", color: "#f87171", mean: 0 },
  { key: "college", label: "大學", color: "#34d399", mean: 0 },
  { key: "highSchool", label: "高中", color: "#fbbf24", mean: 0 },
  { key: "youth", label: "青少棒", color: "#a78bfa", mean: 0 },
];

function generateBellCurve(mean: number, std: number, points: number = 50) {
  const data: number[] = [];
  const min = mean - 3 * std;
  const max = mean + 3 * std;
  for (let i = 0; i < points; i++) {
    const x = min + (i / (points - 1)) * (max - min);
    const y = Math.exp(-0.5 * ((x - mean) / std) ** 2) / (std * Math.sqrt(2 * Math.PI));
    data.push(y);
  }
  return data;
}

const metricsConfig: Record<string, { means: number[]; std: number; range: [number, number] }> = {
  swing_speed: { means: [108, 115, 120, 100, 90], std: 8, range: [70, 140] },
  attack_angle: { means: [8, 10, 12, 6, 4], std: 5, range: [-10, 30] },
  swing_time: { means: [0.18, 0.16, 0.15, 0.20, 0.22], std: 0.03, range: [0.08, 0.30] },
  exit_velo: { means: [85, 92, 98, 78, 70], std: 8, range: [50, 120] },
  launch_angle: { means: [12, 14, 15, 10, 8], std: 8, range: [-15, 40] },
  top20_la: { means: [18, 20, 22, 15, 12], std: 5, range: [0, 35] },
  smash_factor: { means: [1.15, 1.25, 1.30, 1.10, 1.00], std: 0.12, range: [0.6, 1.6] },
};

const BattingDistributionChart = () => {
  const [metric, setMetric] = useState("swing_speed");

  const chartData = useMemo(() => {
    const config = metricsConfig[metric];
    const points = 50;
    const range = config.range;
    const result = [];
    for (let i = 0; i < points; i++) {
      const x = range[0] + (i / (points - 1)) * (range[1] - range[0]);
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
  const unit = metrics.find((m) => m.value === metric)?.unit ?? "";

  /** 根據指標不同使用不同的數字格式 */
  const formatMean = (v: number) => {
    if (metric === "swing_time") return v.toFixed(2);
    if (metric === "smash_factor") return v.toFixed(2);
    return v.toFixed(1);
  };

  return (
    <div className="space-y-3">
      <ChartControls>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ChartControls>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 28, right: 24, left: 16, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="x" type="number" domain={config.range} tick={{ fontSize: 10 }} tickCount={8} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="personal" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} strokeWidth={2} name="個人" />
            <Area type="monotone" dataKey="affiliate" stroke="#f87171" fill="none" strokeWidth={1} strokeDasharray="6 3" name="職業" />
            <Area type="monotone" dataKey="college" stroke="#34d399" fill="none" strokeWidth={1} strokeDasharray="6 3" name="大學" />
            <Area type="monotone" dataKey="highSchool" stroke="#fbbf24" fill="none" strokeWidth={1} strokeDasharray="6 3" name="高中" />
            <Area type="monotone" dataKey="youth" stroke="#a78bfa" fill="none" strokeWidth={1} strokeDasharray="6 3" name="青少棒" />
            {/* ReferenceLine：虛線 + 層級名稱與平均值標在線頂 */}
            {config.means.map((mean, idx) => (
              <ReferenceLine
                key={idx}
                x={mean}
                stroke={levels[idx].color}
                strokeDasharray="3 3"
                strokeWidth={levels[idx].key === "personal" ? 2 : 1}
                label={{
                  value: `${levels[idx].label} ${formatMean(mean)}`,
                  position: "top",
                  fontSize: 9,
                  fill: levels[idx].color,
                  fontWeight: levels[idx].key === "personal" ? 700 : 500,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px]">
        {levels.map((l, idx) => (
          <span key={l.key} className="flex items-center gap-1">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: l.color }} />
            <span>
              {l.label}
              <span className="ml-1 font-medium" style={{ color: l.color }}>
                {formatMean(config.means[idx])}{unit}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default BattingDistributionChart;
