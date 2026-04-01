import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pitchTypeConfig = [
  { type: "FB", label: "FB", color: "#ef4444" },
  { type: "CB", label: "CB", color: "#3b82f6" },
  { type: "SL", label: "SL", color: "#22c55e" },
  { type: "CH", label: "CH", color: "#f59e0b" },
];

// Generate mock pitch locations across a 5x5 grid (strike zone 3x3 + outer zones)
const generateHeatmapData = (types: string[]) => {
  // 5x5 grid: row 0 = top outer, rows 1-3 = strike zone, row 4 = bottom outer
  // col 0 = left outer, cols 1-3 = strike zone, col 4 = right outer
  const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));

  // All pitches with locations
  const allPitches = [
    ...Array.from({ length: 40 }, () => ({ type: "FB", x: (Math.random() - 0.5) * 2.4, y: 1.0 + Math.random() * 3.0 })),
    ...Array.from({ length: 25 }, () => ({ type: "CB", x: (Math.random() - 0.5) * 2.4, y: 0.8 + Math.random() * 2.5 })),
    ...Array.from({ length: 20 }, () => ({ type: "SL", x: -0.2 + (Math.random() - 0.5) * 2.2, y: 1.2 + Math.random() * 2.5 })),
    ...Array.from({ length: 15 }, () => ({ type: "CH", x: (Math.random() - 0.5) * 2.0, y: 1.0 + Math.random() * 2.2 })),
  ];

  const filtered = allPitches.filter((p) => types.includes(p.type));

  // Map each pitch to a grid cell
  // Strike zone: x from -0.71 to 0.71, y from 1.5 to 3.5
  filtered.forEach((p) => {
    let col: number;
    if (p.x < -0.71) col = 0;
    else if (p.x < -0.237) col = 1;
    else if (p.x < 0.237) col = 2;
    else if (p.x < 0.71) col = 3;
    else col = 4;

    let row: number;
    if (p.y > 3.5) row = 0;
    else if (p.y > 2.833) row = 1;
    else if (p.y > 2.167) row = 2;
    else if (p.y > 1.5) row = 3;
    else row = 4;

    grid[row][col]++;
  });

  return grid;
};

// Color interpolation from cool (blue) to hot (red)
const getHeatColor = (value: number, max: number): string => {
  if (max === 0) return "rgba(100,100,100,0.15)";
  const t = value / max;
  // Blue → Cyan → Green → Yellow → Red
  if (t < 0.25) {
    const s = t / 0.25;
    return `rgb(${Math.round(59 + s * (34 - 59))}, ${Math.round(130 + s * (211 - 130))}, ${Math.round(246 + s * (153 - 246))})`;
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return `rgb(${Math.round(34 + s * (74 - 34))}, ${Math.round(211 + s * (222 - 211))}, ${Math.round(153 + s * (128 - 153))})`;
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return `rgb(${Math.round(74 + s * (234 - 74))}, ${Math.round(222 + s * (179 - 222))}, ${Math.round(128 + s * (8 - 128))})`;
  }
  const s = (t - 0.75) / 0.25;
  return `rgb(${Math.round(234 + s * (239 - 234))}, ${Math.round(179 + s * (68 - 179))}, ${Math.round(8 + s * (68 - 8))})`;
};

const PitchLocationChart = () => {
  const [activeTypes, setActiveTypes] = useState<string[]>(["FB", "CB", "SL", "CH"]);

  const toggleType = (t: string) => {
    setActiveTypes((prev) =>
      prev.includes(t) ? prev.filter((p) => p !== t) : [...prev, t]
    );
  };

  const grid = generateHeatmapData(activeTypes);
  const maxVal = Math.max(...grid.flat(), 1);

  const w = 260, h = 300;
  const zoneX = 50, zoneY = 30;
  const cellW = 40, cellH = 40;
  const outerW = 25, outerH = 25;

  // Zone positions: 5x5 grid
  const getCellRect = (row: number, col: number) => {
    // Outer zones are thinner
    let x: number, y: number, cw: number, ch: number;
    if (col === 0) { x = zoneX - outerW; cw = outerW; }
    else if (col <= 3) { x = zoneX + (col - 1) * cellW; cw = cellW; }
    else { x = zoneX + 3 * cellW; cw = outerW; }

    if (row === 0) { y = zoneY - outerH; ch = outerH; }
    else if (row <= 3) { y = zoneY + (row - 1) * cellH; ch = cellH; }
    else { y = zoneY + 3 * cellH; ch = outerH; }

    return { x, y, w: cw, h: ch };
  };

  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[260px] h-auto">
          {/* Heatmap cells */}
          {grid.map((row, ri) =>
            row.map((val, ci) => {
              const rect = getCellRect(ri, ci);
              const isOuter = ri === 0 || ri === 4 || ci === 0 || ci === 4;
              return (
                <g key={`${ri}-${ci}`}>
                  <rect
                    x={rect.x} y={rect.y}
                    width={rect.w} height={rect.h}
                    fill={getHeatColor(val, maxVal)}
                    opacity={isOuter ? 0.5 : 0.75}
                    stroke="#555" strokeWidth={0.5}
                  />
                  {val > 0 && (
                    <text
                      x={rect.x + rect.w / 2}
                      y={rect.y + rect.h / 2 + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isOuter ? 8 : 10}
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Strike zone border */}
          <rect
            x={zoneX} y={zoneY}
            width={cellW * 3} height={cellH * 3}
            fill="none" stroke="white" strokeWidth={1.5}
          />

          {/* Home plate */}
          {(() => {
            const px = zoneX + cellW * 1.5;
            const py = zoneY + cellH * 3 + outerH + 15;
            return (
              <polygon
                points={`${px},${py + 8} ${px - 12},${py} ${px - 12},${py - 5} ${px + 12},${py - 5} ${px + 12},${py}`}
                fill="none" stroke="#666" strokeWidth={1}
              />
            );
          })()}

          {/* Color scale legend */}
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={`legend-${i}`}
              x={zoneX + 3 * cellW + outerW + 15}
              y={zoneY + i * 12}
              width={12} height={12}
              fill={getHeatColor(10 - i, 10)}
              stroke="#333" strokeWidth={0.3}
            />
          ))}
          <text x={zoneX + 3 * cellW + outerW + 30} y={zoneY + 8} fill="#aaa" fontSize={8}>多</text>
          <text x={zoneX + 3 * cellW + outerW + 30} y={zoneY + 116} fill="#aaa" fontSize={8}>少</text>

          {/* Batter indicator */}
          <text x={w - 20} y={zoneY + cellH * 1.5 + 4} fill="#888" fontSize={12} fontWeight="bold">R</text>
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
