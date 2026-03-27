import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  { key: "affiliate", label: "Affiliate", color: "#f87171" },
  { key: "college", label: "College", color: "#34d399" },
  { key: "highSchool", label: "High School", color: "#fbbf24" },
  { key: "youth", label: "Youth", color: "#a78bfa" },
];

const metricsConfig: Record<string, { means: number[]; std: number; range: [number, number] }> = {
  velocity: { means: [88, 92, 95, 82, 75], std: 4, range: [65, 105] },
  spin_rate: { means: [2100, 2250, 2350, 1950, 1800], std: 200, range: [1200, 2800] },
  spin_eff: { means: [92, 95, 96, 88, 85], std: 5, range: [70, 100] },
  extension: { means: [5.8, 6.2, 6.5, 5.5, 5.0], std: 0.4, range: [4.0, 7.5] },
  haa: { means: [15, 17, 18, 13, 11], std: 3, range: [5, 25] },
  vaa: { means: [-4.5, -3.8, -3.2, -5.2, -6.0], std: 1.2, range: [-9, 0] },
};

// Spin direction clock mock
const spinClockData = [
  { pitch: "FB", hour: 12, color: "#ef4444" },
  { pitch: "CB", hour: 7, color: "#3b82f6" },
  { pitch: "SL", hour: 9, color: "#22c55e" },
];

const PitchingDistributionChart = () => {
  const [metric, setMetric] = useState("velocity");

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
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
      </div>

      <div className="flex gap-4">
        {/* KDE Chart */}
        <div className="flex-1 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="x" type="number" domain={config.range} tick={{ fontSize: 10 }} tickCount={6} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="personal" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} strokeWidth={2} name="個人" />
              <Area type="monotone" dataKey="affiliate" stroke="#f87171" fill="none" strokeWidth={1} strokeDasharray="6 3" name="Affiliate" />
              <Area type="monotone" dataKey="college" stroke="#34d399" fill="none" strokeWidth={1} strokeDasharray="6 3" name="College" />
              <Area type="monotone" dataKey="highSchool" stroke="#fbbf24" fill="none" strokeWidth={1} strokeDasharray="6 3" name="High School" />
              <Area type="monotone" dataKey="youth" stroke="#a78bfa" fill="none" strokeWidth={1} strokeDasharray="6 3" name="Youth" />
              {config.means.map((mean, idx) => (
                <ReferenceLine key={idx} x={mean} stroke={levels[idx].color} strokeDasharray="3 3" strokeWidth={1} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Spin Clock */}
        <div className="w-24 flex flex-col items-center">
          <span className="text-[10px] text-muted-foreground mb-1">旋轉方向</span>
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            <circle cx={40} cy={40} r={35} fill="none" stroke="#555" strokeWidth={1} />
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => {
              const angle = ((h - 3) / 12) * Math.PI * 2;
              const x = 40 + Math.cos(angle) * 30;
              const y = 40 + Math.sin(angle) * 30;
              return <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#888">{h}</text>;
            })}
            {spinClockData.map((s) => {
              const angle = ((s.hour - 3) / 12) * Math.PI * 2;
              const x = 40 + Math.cos(angle) * 20;
              const y = 40 + Math.sin(angle) * 20;
              return <circle key={s.pitch} cx={x} cy={y} r={5} fill={s.color} opacity={0.8} />;
            })}
            {spinClockData.map((s) => {
              const angle = ((s.hour - 3) / 12) * Math.PI * 2;
              const x = 40 + Math.cos(angle) * 20;
              const y = 40 + Math.sin(angle) * 20;
              return <text key={`t-${s.pitch}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={5} fill="white" fontWeight="bold">{s.pitch}</text>;
            })}
          </svg>
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
