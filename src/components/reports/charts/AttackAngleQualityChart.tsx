import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ScatterChart as ScatterIcon } from "lucide-react";

const mockBarData = [
  { range: "<-10°", avg: 1.05, max: 1.22 },
  { range: "-10~-5°", avg: 1.12, max: 1.35 },
  { range: "-5~0°", avg: 1.18, max: 1.42 },
  { range: "0~5°", avg: 1.25, max: 1.48 },
  { range: "5~10°", avg: 1.32, max: 1.52 },
  { range: "10~15°", avg: 1.28, max: 1.45 },
  { range: ">15°", avg: 1.15, max: 1.38 },
];

const mockScatterData = Array.from({ length: 45 }, (_, i) => ({
  angle: -12 + (i / 45) * 30 + (Math.random() - 0.5) * 5,
  quality: +(0.9 + Math.random() * 0.7).toFixed(2),
}));

const AttackAngleQualityChart = () => {
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
              <YAxis domain={[0.8, 1.6]} tick={{ fontSize: 10 }} label={{ value: "Smash Factor", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Bar dataKey="avg" fill="#a78bfa" opacity={0.7} name="平均品質" />
              <Line dataKey="max" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} name="最佳品質" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="angle" type="number" domain={[-15, 20]} name="攻擊角度" tick={{ fontSize: 10 }} />
              <YAxis dataKey="quality" type="number" domain={[0.8, 1.6]} name="品質" tick={{ fontSize: 10 }} label={{ value: "Smash Factor", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Scatter data={mockScatterData} fill="#a78bfa" opacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AttackAngleQualityChart;
