/**
 * 3.0 打擊概況摘要 - Swing Speed Distribution Chart
 * Shows a bell curve distribution of swing speeds with reference lines
 * for personal average and level averages.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

/** A single point on the distribution curve */
interface DistributionPoint {
  speed: number;
  frequency: number;
}

/** Generate a normal distribution curve */
function generateBellCurve(
  mean: number,
  stdDev: number,
  min: number,
  max: number,
  points: number,
): DistributionPoint[] {
  const data: DistributionPoint[] = [];
  const step = (max - min) / points;
  for (let i = 0; i <= points; i++) {
    const speed = min + i * step;
    const exponent = -0.5 * Math.pow((speed - mean) / stdDev, 2);
    const frequency =
      (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    data.push({ speed: Math.round(speed), frequency: parseFloat((frequency * 100).toFixed(2)) });
  }
  return data;
}

// --- Mock Data ---
const PERSONAL_AVG = 110; // km/h
const COLLEGE_AVG = 115;
const AFFILIATE_AVG = 120;
const STD_DEV = 8;

const mockDistribution = generateBellCurve(PERSONAL_AVG, STD_DEV, 80, 145, 60);

const referenceLines = [
  { value: PERSONAL_AVG, label: "個人平均", color: "#60a5fa" },
  { value: COLLEGE_AVG, label: "College", color: "#facc15" },
  { value: AFFILIATE_AVG, label: "Affiliate", color: "#f87171" },
];

const BattingSummaryChart = () => {
  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={mockDistribution}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="swingSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
            <XAxis
              dataKey="speed"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{
                value: "揮棒速度 (km/h)",
                position: "insideBottomRight",
                offset: -5,
                fontSize: 11,
                fill: "#94a3b8",
              }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              label={{
                value: "頻率 (%)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fontSize: 11,
                fill: "#94a3b8",
              }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "頻率"]}
              labelFormatter={(label: number) => `${label} km/h`}
            />
            <Area
              type="monotone"
              dataKey="frequency"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#swingSpeedGradient)"
            />
            {referenceLines.map((ref) => (
              <ReferenceLine
                key={ref.label}
                x={ref.value}
                stroke={ref.color}
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: ref.label,
                  position: "top",
                  fontSize: 10,
                  fill: ref.color,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
        {referenceLines.map((ref) => (
          <div key={ref.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-0.5"
              style={{
                backgroundColor: ref.color,
                borderTop: `2px dashed ${ref.color}`,
              }}
            />
            <span>
              {ref.label}: {ref.value} km/h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattingSummaryChart;
