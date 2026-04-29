/**
 * 3.2 水平角 / 初速趨勢圖
 * - 長條圖（灰）= 球數（右軸）
 * - 折線 = 平均初速（藍）+ 最大初速（紅）（左軸）
 * - 不提供散佈圖模式
 */

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RangeData {
  range: string;
  avg: number;
  max: number;
  count: number;
}

const mockBarData: RangeData[] = [
  { range: "-55~-45°", avg: 78, max: 96, count: 5 },
  { range: "-45~-35°", avg: 82, max: 98, count: 9 },
  { range: "-35~-25°", avg: 88, max: 102, count: 14 },
  { range: "-25~-15°", avg: 91, max: 105, count: 18 },
  { range: "-15~-5°", avg: 86, max: 101, count: 22 },
  { range: "-5~5°", avg: 84, max: 99, count: 16 },
  { range: "5~15°", avg: 80, max: 95, count: 10 },
  { range: "15~25°", avg: 75, max: 92, count: 6 },
];

const HorizontalAngleVeloChart = () => {
  return (
    <div className="space-y-3">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={mockBarData} margin={{ top: 16, right: 40, left: 16, bottom: 36 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={40}
            />
            {/* 左軸：初速 */}
            <YAxis
              yAxisId="velo"
              domain={[60, 110]}
              tick={{ fontSize: 10 }}
              label={{ value: "MPH", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10 } }}
            />
            {/* 右軸：球數 */}
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              label={{ value: "球數", angle: 90, position: "insideRight", offset: 10, style: { fontSize: 10 } }}
            />
            <Tooltip />
            {/* 長條：球數（右軸） */}
            <Bar
              yAxisId="count"
              dataKey="count"
              name="球數"
              fill="#cbd5e1"
              fillOpacity={0.7}
              radius={[4, 4, 0, 0]}
            />
            {/* 折線：平均初速（左軸） */}
            <Line
              yAxisId="velo"
              type="monotone"
              dataKey="avg"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 3, fill: "#60a5fa" }}
              name="平均初速"
            />
            {/* 折線：最大初速（左軸） */}
            <Line
              yAxisId="velo"
              type="monotone"
              dataKey="max"
              stroke="#f87171"
              strokeWidth={2}
              dot={{ r: 3, fill: "#f87171" }}
              name="最大初速"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Pull / Oppo 方向標示 */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-2">
        <span>← Pull</span>
        <span>Oppo →</span>
      </div>

      {/* 圖例 */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-blue-400" />
          <span>平均初速</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 bg-red-400" />
          <span>最大初速</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-300" />
          <span>球數</span>
        </div>
      </div>
    </div>
  );
};

export default HorizontalAngleVeloChart;
