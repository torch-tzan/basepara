import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ScatterChart as ScatterIcon } from "lucide-react";

// 規格：只要一條線，平均值就好
const mockLineData = [
  { range: "<-10°", avg: 1.05 },
  { range: "-10~-5°", avg: 1.12 },
  { range: "-5~0°", avg: 1.18 },
  { range: "0~5°", avg: 1.25 },
  { range: "5~10°", avg: 1.32 },
  { range: "10~15°", avg: 1.28 },
  { range: ">15°", avg: 1.15 },
];

const mockScatterData = Array.from({ length: 45 }, (_, i) => ({
  angle: -12 + (i / 45) * 30 + (Math.random() - 0.5) * 5,
  quality: +(0.9 + Math.random() * 0.7).toFixed(2),
}));

const AttackAngleQualityChart = () => {
  const [mode, setMode] = useState<"line" | "scatter">("line");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
        <div className="flex gap-1">
          <Button variant={mode === "line" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("line")}>
            <TrendingUp className="w-3 h-3 mr-1" />趨勢
          </Button>
          <Button variant={mode === "scatter" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setMode("scatter")}>
            <ScatterIcon className="w-3 h-3 mr-1" />散佈
          </Button>
        </div>
      </div>
      <div className="h-64">
        {mode === "line" ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockLineData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis domain={[0.8, 1.6]} tick={{ fontSize: 10 }} label={{ value: "Smash Factor", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
              <Tooltip />
              <Line dataKey="avg" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa" }} name="平均品質" />
            </LineChart>
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
