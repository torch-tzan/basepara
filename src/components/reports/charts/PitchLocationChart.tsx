import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pitchTypeConfig = [
  { type: "FB", label: "FB", color: "#ef4444" },
  { type: "CB", label: "CB", color: "#3b82f6" },
  { type: "SL", label: "SL", color: "#22c55e" },
  { type: "CH", label: "CH", color: "#f59e0b" },
];

// Generate mock pitch locations
const allPitches = [
  ...Array.from({ length: 20 }, () => ({ type: "FB", x: (Math.random() - 0.5) * 1.8, y: 1.5 + Math.random() * 2.0 })),
  ...Array.from({ length: 12 }, () => ({ type: "CB", x: (Math.random() - 0.5) * 2.0, y: 1.0 + Math.random() * 1.5 })),
  ...Array.from({ length: 10 }, () => ({ type: "SL", x: -0.2 + (Math.random() - 0.5) * 1.8, y: 1.5 + Math.random() * 1.8 })),
  ...Array.from({ length: 8 }, () => ({ type: "CH", x: (Math.random() - 0.5) * 1.6, y: 1.2 + Math.random() * 1.6 })),
];

const PitchLocationChart = () => {
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB", "CB", "SL", "CH"]);

  const toggleType = (t: string) => {
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]
    );
  };

  const filteredPitches = allPitches.filter((p) => activeTypes.includes(p.type));

  // SVG coordinates: strike zone from x=-0.71 to 0.71, y=1.5 to 3.5 (feet)
  const w = 240, h = 300;
  const mapX = (x: number) => w / 2 + x * 80;
  const mapY = (y: number) => h - 30 - (y - 0.5) * 70;

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[240px] h-auto">
          {/* Strike zone rectangle (no inner grid per spec) */}
          <rect
            x={mapX(-0.71)} y={mapY(3.5)}
            width={0.71 * 2 * 80} height={(3.5 - 1.5) * 70}
            fill="none" stroke="#888" strokeWidth={1.5}
          />

          {/* Pitch dots */}
          {filteredPitches.map((p, i) => {
            const conf = pitchTypeConfig.find((c) => c.type === p.type);
            return (
              <circle
                key={i}
                cx={mapX(p.x)} cy={mapY(p.y)}
                r={5}
                fill={conf?.color || "#999"}
                opacity={0.55}
                stroke={conf?.color || "#999"}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Home plate */}
          <polygon
            points={`${mapX(0)},${h - 5} ${mapX(-0.35)},${h - 15} ${mapX(-0.35)},${h - 20} ${mapX(0.35)},${h - 20} ${mapX(0.35)},${h - 15}`}
            fill="none" stroke="#666" strokeWidth={1}
          />
        </svg>
      </div>

      {/* Pitch type toggle buttons */}
      <div className="flex justify-center gap-2">
        {pitchTypeConfig.map((pt) => (
          <Button
            key={pt.type}
            variant={activeTypes.includes(pt.type) ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            style={activeTypes.includes(pt.type) ? { backgroundColor: pt.color, borderColor: pt.color } : {}}
            onClick={() => toggleType(pt.type)}
          >
            {pt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PitchLocationChart;
