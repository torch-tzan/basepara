import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const pitchTypes = [
  { type: "FB", color: "#ef4444", avgX: 8, avgY: 16, points: Array.from({ length: 15 }, () => ({ x: 8 + (Math.random() - 0.5) * 6, y: 16 + (Math.random() - 0.5) * 6 })) },
  { type: "CB", color: "#3b82f6", avgX: -4, avgY: -8, points: Array.from({ length: 15 }, () => ({ x: -4 + (Math.random() - 0.5) * 5, y: -8 + (Math.random() - 0.5) * 5 })) },
  { type: "SL", color: "#22c55e", avgX: -6, avgY: 4, points: Array.from({ length: 15 }, () => ({ x: -6 + (Math.random() - 0.5) * 4, y: 4 + (Math.random() - 0.5) * 4 })) },
  { type: "CH", color: "#f59e0b", avgX: 12, avgY: 6, points: Array.from({ length: 15 }, () => ({ x: 12 + (Math.random() - 0.5) * 5, y: 6 + (Math.random() - 0.5) * 5 })) },
];

const PitchMovementChart = () => {
  const [showAvg, setShowAvg] = useState(true);
  const [showEllipse, setShowEllipse] = useState(true);

  const w = 300, h = 280, cx = w / 2, cy = h / 2;
  const scaleX = (v: number) => cx + v * 7;
  const scaleY = (v: number) => cy - v * 7;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <Checkbox id="avg" checked={showAvg} onCheckedChange={(c) => setShowAvg(c as boolean)} className="h-3.5 w-3.5" />
            <Label htmlFor="avg" className="text-[10px] cursor-pointer">平均點</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="ell" checked={showEllipse} onCheckedChange={(c) => setShowEllipse(c as boolean)} className="h-3.5 w-3.5" />
            <Label htmlFor="ell" className="text-[10px] cursor-pointer">誤差範圍</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[300px] h-auto">
          {/* Grid */}
          <line x1={0} y1={cy} x2={w} y2={cy} stroke="#555" strokeWidth={0.5} />
          <line x1={cx} y1={0} x2={cx} y2={h} stroke="#555" strokeWidth={0.5} />
          {[-20, -10, 10, 20].map((v) => (
            <g key={v}>
              <line x1={scaleX(v)} y1={cy - 3} x2={scaleX(v)} y2={cy + 3} stroke="#666" strokeWidth={0.5} />
              <text x={scaleX(v)} y={cy + 12} textAnchor="middle" fontSize={8} fill="#888">{v}</text>
              <line x1={cx - 3} y1={scaleY(v)} x2={cx + 3} y2={scaleY(v)} stroke="#666" strokeWidth={0.5} />
              <text x={cx - 10} y={scaleY(v) + 3} textAnchor="end" fontSize={8} fill="#888">{v}</text>
            </g>
          ))}
          <text x={w - 5} y={cy - 5} textAnchor="end" fontSize={9} fill="#999">HB (in)</text>
          <text x={cx + 5} y={12} fontSize={9} fill="#999">VB (in)</text>

          {/* Pitch data */}
          {pitchTypes.map((pt) => (
            <g key={pt.type}>
              {showEllipse && (
                <ellipse cx={scaleX(pt.avgX)} cy={scaleY(pt.avgY)} rx={20} ry={18} fill={pt.color} opacity={0.1} stroke={pt.color} strokeWidth={1} strokeDasharray="3 2" />
              )}
              {pt.points.map((p, i) => (
                <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill={pt.color} opacity={0.5} />
              ))}
              {showAvg && (
                <text x={scaleX(pt.avgX)} y={scaleY(pt.avgY) + 4} textAnchor="middle" fontSize={12} fill={pt.color} fontWeight="bold">★</text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px]">
        {pitchTypes.map((pt) => (
          <span key={pt.type} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: pt.color }} />
            {pt.type}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PitchMovementChart;
