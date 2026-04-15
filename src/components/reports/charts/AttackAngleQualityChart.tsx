import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter,
} from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, ScatterChart as ScatterIcon } from "lucide-react";
import { ChartControls } from "../chartControlsContext";

/**
 * 3.3 攻擊角度 / 擊球品質趨勢圖
 * - 只有一條折線：各區間「平均品質」(Smash Factor)
 * - 長條圖：各區間的球數（右軸）
 * - 攻擊角度區間：<-10 / -10~-5 / -5~0 / 0~5 / 5~10 / 10~15 / 15~20 / 20~25 / >25
 */
const mockLineData = [
  { range: "<-10°",    avg: 1.05, count: 6 },
  { range: "-10~-5°",  avg: 1.12, count: 14 },
  { range: "-5~0°",    avg: 1.18, count: 22 },
  { range: "0~5°",     avg: 1.25, count: 38 },
  { range: "5~10°",    avg: 1.32, count: 45 },
  { range: "10~15°",   avg: 1.28, count: 32 },
  { range: "15~20°",   avg: 1.20, count: 18 },
  { range: "20~25°",   avg: 1.10, count: 9 },
  { range: ">25°",     avg: 1.02, count: 4 },
];

const mockScatterData = Array.from({ length: 60 }, (_, i) => ({
  angle: -15 + (i / 60) * 45 + (Math.random() - 0.5) * 4,
  quality: +(0.9 + Math.random() * 0.7).toFixed(2),
}));

const AttackAngleQualityChart = () => {
  const [mode, setMode] = useState<"line" | "scatter">("line");

  return (
    <div className="space-y-3">
      <ChartControls>
        <div className="flex gap-1">
          <Button variant={mode === "line" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("line")}>
            <TrendingUp className="w-3 h-3 mr-1" />趨勢
          </Button>
          <Button variant={mode === "scatter" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("scatter")}>
            <ScatterIcon className="w-3 h-3 mr-1" />散佈
          </Button>
        </div>
      </ChartControls>
      <div className="h-48">
        {mode === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockLineData} margin={{ top: 16, right: 40, left: 16, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={40}
              />
              {/* 左軸：Smash Factor（平均品質） */}
              <YAxis
                yAxisId="quality"
                domain={[0.8, 1.6]}
                tick={{ fontSize: 10 }}
                label={{ value: "Smash Factor", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
              />
              {/* 右軸：球數 */}
              <YAxis
                yAxisId="count"
                orientation="right"
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                label={{ value: "球數", angle: 90, position: "insideRight", style: { fontSize: 10 } }}
              />
              <Tooltip />
              {/* 長條：球數 */}
              <Bar
                yAxisId="count"
                dataKey="count"
                name="球數"
                fill="#cbd5e1"
                fillOpacity={0.7}
                radius={[4, 4, 0, 0]}
              />
              {/* 折線：平均品質 */}
              <Line
                yAxisId="quality"
                type="monotone"
                dataKey="avg"
                name="平均品質"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ r: 3, fill: "#a78bfa" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 24, left: 16, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="angle" type="number" domain={[-15, 30]} name="攻擊角度" tick={{ fontSize: 10 }} />
              <YAxis dataKey="quality" type="number" domain={[0.8, 1.6]} name="品質" tick={{ fontSize: 10 }} label={{ value: "Smash Factor", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Scatter data={mockScatterData} fill="#a78bfa" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend for line mode */}
      {mode === "line" && (
        <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ backgroundColor: "#a78bfa" }} />
            <span>平均品質 (Smash Factor)</span>
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

export default AttackAngleQualityChart;
