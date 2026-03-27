import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ScatterChart as ScatterIcon } from "lucide-react";

const mockBarData = [
  { range: "-55~-45°", avg: 78, max: 96 },
  { range: "-45~-35°", avg: 82, max: 98 },
  { range: "-35~-25°", avg: 88, max: 102 },
  { range: "-25~-15°", avg: 91, max: 105 },
  { range: "-15~-5°", avg: 86, max: 101 },
  { range: "-5~5°", avg: 84, max: 99 },
  { range: "5~15°", avg: 80, max: 95 },
  { range: "15~25°", avg: 75, max: 92 },
];

const mockScatterData = Array.from({ length: 40 }, (_, i) => ({
  angle: -55 + (i / 40) * 80 + (Math.random() - 0.5) * 10,
  velo: 65 + Math.random() * 40,
}));

const HorizontalAngleVeloChart = () => {
  const [mode, setMode] = useState<"bar" | "scatter">("bar");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
        <div className="flex gap-1">
          <Button variant={mode === "bar" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("bar")}>
            <BarChart3 className="w-3 h-3 mr-1" />長條
          </Button>
          <Button variant={mode === "scatter" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("scatter")}>
            <ScatterIcon className="w-3 h-3 mr-1" />散佈
          </Button>
        </div>
      </div>
      <div className="h-64">
        {mode === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockBarData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis domain={[60, 110]} tick={{ fontSize: 10 }} label={{ value: "MPH", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#60a5fa" opacity={0.7} name="平均初速" />
              <Line dataKey="max" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="最大初速" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="angle" type="number" domain={[-60, 30]} name="水平角" tick={{ fontSize: 10 }} />
              <YAxis dataKey="velo" type="number" domain={[60, 110]} name="初速" tick={{ fontSize: 10 }} label={{ value: "MPH", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Scatter data={mockScatterData} fill="#60a5fa" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground px-2">
        <span>← Pull</span>
        <span>Oppo →</span>
      </div>
    </div>
  );
};

export default HorizontalAngleVeloChart;
