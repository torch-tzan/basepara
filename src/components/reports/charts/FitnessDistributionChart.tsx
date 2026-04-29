import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartControls } from "../chartControlsContext";

const metrics = [
  { value: "grip_dom", label: "握力 慣用手", unit: "kg" },
  { value: "grip_non", label: "握力 非慣用手", unit: "kg" },
  { value: "medball_dom", label: "藥球側拋 慣用手", unit: "kph" },
  { value: "medball_non", label: "藥球側拋 非慣用手", unit: "kph" },
  { value: "cmj_height", label: "反向跳 跳躍高度", unit: "cm" },
  { value: "dj_rsi", label: "落下跳 反應肌力", unit: "" },
  { value: "dj_contact", label: "落下跳 觸地時間", unit: "s" },
  { value: "pullup", label: "引體向上", unit: "次" },
  { value: "sprint_total", label: "衝刺 總完成時間", unit: "s" },
];

const levels = [
  { key: "personal", label: "個人", color: "#60a5fa" },
  { key: "affiliate", label: "職業", color: "#f87171" },
  { key: "college", label: "大學", color: "#34d399" },
  { key: "highSchool", label: "高中", color: "#fbbf24" },
  { key: "youth", label: "青少棒", color: "#a78bfa" },
];

const metricsConfig: Record<string, { means: number[]; std: number; range: [number, number] }> = {
  grip_dom: { means: [42, 56, 50, 38, 30], std: 7, range: [15, 75] },
  grip_non: { means: [39, 52, 47, 36, 28], std: 7, range: [15, 70] },
  medball_dom: { means: [52, 68, 60, 48, 38], std: 8, range: [20, 90] },
  medball_non: { means: [49, 64, 56, 45, 35], std: 8, range: [20, 85] },
  cmj_height: { means: [42, 55, 48, 38, 30], std: 6, range: [15, 70] },
  dj_rsi: { means: [1.35, 1.75, 1.55, 1.20, 0.90], std: 0.30, range: [0.3, 2.5] },
  dj_contact: { means: [0.28, 0.22, 0.25, 0.32, 0.38], std: 0.06, range: [0.1, 0.6] },
  pullup: { means: [8, 18, 14, 5, 2], std: 4, range: [0, 30] },
  sprint_total: { means: [1.65, 1.45, 1.55, 1.75, 1.95], std: 0.15, range: [1.0, 2.5] },
};

interface FitnessDistributionChartProps {
  defaultMetric?: string;
  lockMetric?: boolean;
  compact?: boolean;
}

const FitnessDistributionChart = ({
  defaultMetric = "grip_dom",
  lockMetric = false,
  compact = false,
}: FitnessDistributionChartProps = {}) => {
  const [metric, setMetric] = useState(defaultMetric);

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
  const formatMean = (v: number) => {
    if (metric === "dj_rsi" || metric === "dj_contact" || metric === "sprint_total") return v.toFixed(2);
    if (metric === "pullup") return v.toFixed(0);
    return v.toFixed(1);
  };

  return (
    <div className="space-y-2">
      {!lockMetric && (
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
      )}
      {lockMetric && (
        <p className="text-xs font-medium text-muted-foreground">
          {metrics.find((m) => m.value === metric)?.label} 分布
        </p>
      )}
      <div className={compact ? "h-32" : "h-48"}>
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

export default FitnessDistributionChart;
