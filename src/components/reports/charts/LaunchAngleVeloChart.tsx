/**
 * 3.1 擊球仰角/初速趨勢圖 - Launch Angle vs Exit Velocity
 * Bar chart grouped by launch angle ranges with avg/max lines.
 * Includes a toggle to switch between bar chart and scatter plot.
 */

import { useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, ScatterChart as ScatterIcon } from "lucide-react";
import { ChartControls } from "../chartControlsContext";

// --- Types ---
interface GroupData {
  range: string;
  avg: number;
  max: number;
  count: number;
}

interface ScatterPoint {
  launchAngle: number;
  exitVelo: number;
  group: string;
}

// --- Mock Data ---
const mockGroupData: GroupData[] = [
  { range: "< -12°", avg: 78, max: 91, count: 12 },
  { range: "-12°~-4°", avg: 85, max: 96, count: 28 },
  { range: "-4°~4°", avg: 92, max: 103, count: 45 },
  { range: "4°~12°", avg: 89, max: 101, count: 38 },
  { range: "> 12°", avg: 82, max: 95, count: 18 },
];

const SCATTER_COLORS = ["#f87171", "#fb923c", "#60a5fa", "#34d399", "#a78bfa"];

function generateScatterData(): ScatterPoint[] {
  const ranges: Array<{ label: string; min: number; max: number }> = [
    { label: "< -12°", min: -25, max: -12 },
    { label: "-12°~-4°", min: -12, max: -4 },
    { label: "-4°~4°", min: -4, max: 4 },
    { label: "4°~12°", min: 4, max: 12 },
    { label: "> 12°", min: 12, max: 25 },
  ];
  const points: ScatterPoint[] = [];
  ranges.forEach((r) => {
    const n = 8 + Math.floor(Math.random() * 10);
    for (let i = 0; i < n; i++) {
      points.push({
        launchAngle: parseFloat((r.min + Math.random() * (r.max - r.min)).toFixed(1)),
        exitVelo: parseFloat((75 + Math.random() * 30).toFixed(1)),
        group: r.label,
      });
    }
  });
  return points;
}

const mockScatterData = generateScatterData();

// --- Component ---
const LaunchAngleVeloChart = () => {
  const [mode, setMode] = useState<"bar" | "scatter">("bar");

  return (
    <div className="space-y-3">
      <ChartControls>
        <div className="flex gap-1">
          <Button variant={mode === "bar" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("bar")}>
            <BarChart3 className="w-3 h-3 mr-1" />長條
          </Button>
          <Button variant={mode === "scatter" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("scatter")}>
            <ScatterIcon className="w-3 h-3 mr-1" />散佈
          </Button>
        </div>
      </ChartControls>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {mode === "bar" ? (
            <ComposedChart
              data={mockGroupData}
              margin={{ top: 16, right: 40, left: 16, bottom: 32 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                label={{
                  value: "Launch Angle",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              {/* 左軸：初速 */}
              <YAxis
                yAxisId="velo"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                domain={[60, 110]}
                label={{
                  value: "Exit Velo (MPH)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              {/* 右軸：球數 */}
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                allowDecimals={false}
                label={{
                  value: "球數",
                  angle: 90,
                  position: "insideRight",
                  offset: 10,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              <Tooltip />
              {/* 長條：球數（右軸） */}
              <Bar
                yAxisId="count"
                dataKey="count"
                name="球數"
                fill="#cbd5e1"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              {/* 折線：平均初速（左軸） */}
              <Line
                yAxisId="velo"
                type="monotone"
                dataKey="avg"
                name="平均初速"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ r: 3, fill: "#60a5fa" }}
              />
              {/* 折線：最大初速（左軸） */}
              <Line
                yAxisId="velo"
                type="monotone"
                dataKey="max"
                name="最大初速"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f87171" }}
              />
            </ComposedChart>
          ) : (
            <ScatterChart margin={{ top: 16, right: 40, left: 16, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
              <XAxis
                type="number"
                dataKey="launchAngle"
                name="Launch Angle"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                domain={[-30, 30]}
                label={{
                  value: "Launch Angle (°)",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              <YAxis
                type="number"
                dataKey="exitVelo"
                name="Exit Velo"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                domain={[70, 110]}
                label={{
                  value: "Exit Velo (MPH)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              <ZAxis range={[30, 30]} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "Launch Angle") return [`${value}°`, name];
                  return [`${value} MPH`, name];
                }}
              />
              <Scatter name="擊球數據" data={mockScatterData}>
                {mockScatterData.map((entry, index) => {
                  const groupIndex = mockGroupData.findIndex(
                    (g) => g.range === entry.group,
                  );
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={SCATTER_COLORS[groupIndex >= 0 ? groupIndex : 0]}
                      fillOpacity={0.7}
                    />
                  );
                })}
              </Scatter>
            </ScatterChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Bar mode legend */}
      {mode === "bar" && (
        <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-blue-400" />
            <span>平均初速 (Avg)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5 bg-red-400" />
            <span>最大初速 (Max)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-slate-300" />
            <span>球數</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LaunchAngleVeloChart;
