import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

const mockData = Array.from({ length: 40 }, (_, i) => ({
  swingTime: +(0.12 + Math.random() * 0.16).toFixed(3),
  attackAngle: +(-15 + Math.random() * 40).toFixed(1),
}));

const AttackAngleSwingTimeChart = () => {
  return (
    <div className="space-y-3">
      <Badge variant="secondary" className="text-[10px]">模擬數據</Badge>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="swingTime" type="number" domain={[0.1, 0.3]}
              name="揮擊時間" tick={{ fontSize: 10 }}
              label={{ value: "揮擊時間 (s)", position: "bottom", style: { fontSize: 10 } }}
            />
            <YAxis
              dataKey="attackAngle" type="number" domain={[-20, 30]}
              name="攻擊角度" tick={{ fontSize: 10 }}
              label={{ value: "攻擊角度 (°)", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
            />
            <Tooltip formatter={(value: number, name: string) => [name === "揮擊時間" ? `${value}s` : `${value}°`, name]} />
            <Scatter data={mockData} fill="#60a5fa" opacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttackAngleSwingTimeChart;
