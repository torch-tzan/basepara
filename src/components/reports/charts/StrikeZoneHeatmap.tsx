import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const metrics = [
  { value: "exit_velo", label: "擊球初速" },
  { value: "launch_angle", label: "擊球仰角" },
];

// Mock data: 9 inner zones + 4 outer zones
const mockData: Record<string, Record<string, number>> = {
  exit_velo: {
    z1: 88, z2: 92, z3: 85, z4: 95, z5: 98, z6: 90, z7: 82, z8: 87, z9: 80,
    top: 72, bottom: 68, left: 75, right: 70,
  },
  launch_angle: {
    z1: 22, z2: 15, z3: 20, z4: 12, z5: 10, z6: 14, z7: 8, z8: 5, z9: 10,
    top: 28, bottom: -5, left: 18, right: 16,
  },
};

function getColor(value: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  // Blue (cold) to Red (hot)
  const r = Math.round(50 + t * 205);
  const g = Math.round(50 + (1 - Math.abs(t - 0.5) * 2) * 100);
  const b = Math.round(255 - t * 205);
  return `rgb(${r}, ${g}, ${b})`;
}

const StrikeZoneHeatmap = () => {
  const [metric, setMetric] = useState("exit_velo");
  const data = mockData[metric];
  const values = Object.values(data);
  const min = Math.min(...values);
  const max = Math.max(...values);

  const zoneSize = 60;
  const padding = 40;
  const outerSize = 30;
  const totalW = zoneSize * 3 + outerSize * 2 + padding * 2;
  const totalH = zoneSize * 3 + outerSize * 2 + padding * 2;
  const ox = padding + outerSize; // inner grid origin x
  const oy = padding + outerSize; // inner grid origin y

  const innerZones = [
    { id: "z1", row: 0, col: 0 }, { id: "z2", row: 0, col: 1 }, { id: "z3", row: 0, col: 2 },
    { id: "z4", row: 1, col: 0 }, { id: "z5", row: 1, col: 1 }, { id: "z6", row: 1, col: 2 },
    { id: "z7", row: 2, col: 0 }, { id: "z8", row: 2, col: 1 }, { id: "z9", row: 2, col: 2 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
        <Select value={metric} onValueChange={setMetric}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-[280px] h-auto">
          {/* Outer zones */}
          <rect x={ox} y={oy - outerSize} width={zoneSize * 3} height={outerSize} fill={getColor(data.top, min, max)} opacity={0.5} stroke="#666" strokeWidth={0.5} />
          <text x={ox + zoneSize * 1.5} y={oy - outerSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white">{data.top}</text>

          <rect x={ox} y={oy + zoneSize * 3} width={zoneSize * 3} height={outerSize} fill={getColor(data.bottom, min, max)} opacity={0.5} stroke="#666" strokeWidth={0.5} />
          <text x={ox + zoneSize * 1.5} y={oy + zoneSize * 3 + outerSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white">{data.bottom}</text>

          <rect x={ox - outerSize} y={oy} width={outerSize} height={zoneSize * 3} fill={getColor(data.left, min, max)} opacity={0.5} stroke="#666" strokeWidth={0.5} />
          <text x={ox - outerSize / 2} y={oy + zoneSize * 1.5} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white">{data.left}</text>

          <rect x={ox + zoneSize * 3} y={oy} width={outerSize} height={zoneSize * 3} fill={getColor(data.right, min, max)} opacity={0.5} stroke="#666" strokeWidth={0.5} />
          <text x={ox + zoneSize * 3 + outerSize / 2} y={oy + zoneSize * 1.5} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="white">{data.right}</text>

          {/* Inner 9 zones */}
          {innerZones.map((z) => {
            const x = ox + z.col * zoneSize;
            const y = oy + z.row * zoneSize;
            const val = data[z.id];
            return (
              <g key={z.id}>
                <rect x={x} y={y} width={zoneSize} height={zoneSize} fill={getColor(val, min, max)} opacity={0.75} stroke="#888" strokeWidth={1} />
                <text x={x + zoneSize / 2} y={y + zoneSize / 2} textAnchor="middle" dominantBaseline="middle" fontSize={13} fontWeight="bold" fill="white">{val}</text>
              </g>
            );
          })}

          {/* Strike zone border */}
          <rect x={ox} y={oy} width={zoneSize * 3} height={zoneSize * 3} fill="none" stroke="white" strokeWidth={2} />

          {/* Batter hand indicator */}
          <text x={totalW - padding + 5} y={oy + zoneSize * 1.5} fontSize={11} fill="#999" textAnchor="start">R</text>
        </svg>
      </div>

      {/* Color legend */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
        <span>冷</span>
        <div className="flex h-3">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="w-4 h-full" style={{ backgroundColor: getColor(min + (i / 9) * (max - min), min, max) }} />
          ))}
        </div>
        <span>熱</span>
      </div>
    </div>
  );
};

export default StrikeZoneHeatmap;
