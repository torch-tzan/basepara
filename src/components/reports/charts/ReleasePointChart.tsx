import { useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pitchColors: Record<string, string> = {
  FB: "#ef4444",
  CB: "#3b82f6",
  SL: "#22c55e",
  CH: "#f59e0b",
};

// Mock release point data
const mockSideHeight = {
  FB: Array.from({ length: 12 }, () => ({ x: +(1.2 + (Math.random() - 0.5) * 0.3).toFixed(2), y: +(1.75 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  CB: Array.from({ length: 10 }, () => ({ x: +(1.15 + (Math.random() - 0.5) * 0.3).toFixed(2), y: +(1.72 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  SL: Array.from({ length: 10 }, () => ({ x: +(1.25 + (Math.random() - 0.5) * 0.3).toFixed(2), y: +(1.73 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  CH: Array.from({ length: 8 }, () => ({ x: +(1.18 + (Math.random() - 0.5) * 0.3).toFixed(2), y: +(1.74 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
};

const mockExtHeight = {
  FB: Array.from({ length: 12 }, () => ({ x: +(1.85 + (Math.random() - 0.5) * 0.2).toFixed(2), y: +(1.75 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  CB: Array.from({ length: 10 }, () => ({ x: +(1.80 + (Math.random() - 0.5) * 0.2).toFixed(2), y: +(1.72 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  SL: Array.from({ length: 10 }, () => ({ x: +(1.82 + (Math.random() - 0.5) * 0.2).toFixed(2), y: +(1.73 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
  CH: Array.from({ length: 8 }, () => ({ x: +(1.78 + (Math.random() - 0.5) * 0.2).toFixed(2), y: +(1.74 + (Math.random() - 0.5) * 0.15).toFixed(2) })),
};

const ReleasePointChart = () => {
  const [mode, setMode] = useState<"side" | "ext">("side");
  const data = mode === "side" ? mockSideHeight : mockExtHeight;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
        <div className="flex gap-1">
          <Button variant={mode === "side" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setMode("side")}>
            側向/高度
          </Button>
          <Button variant={mode === "ext" ? "default" : "ghost"} size="sm" className="h-7 px-2 text-xs" onClick={() => setMode("ext")}>
            Extension/高度
          </Button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              type="number"
              dataKey="x"
              domain={mode === "side" ? [0.8, 1.6] : [1.5, 2.1]}
              tick={{ fontSize: 10 }}
              label={{ value: mode === "side" ? "Release Side (m)" : "Extension (m)", position: "bottom", style: { fontSize: 10 } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[1.5, 2.0]}
              tick={{ fontSize: 10 }}
              label={{ value: "Release Height (m)", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
            />
            <Tooltip />
            {Object.entries(data).map(([type, points]) => (
              <Scatter key={type} data={points} fill={pitchColors[type]} opacity={0.6} name={type} />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-[10px]">
        {Object.entries(pitchColors).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
            {type}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ReleasePointChart;
