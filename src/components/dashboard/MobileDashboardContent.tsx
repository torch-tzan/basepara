import { Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, Area, AreaChart } from "recharts";

interface PerformanceCard {
  title: string;
  icon: React.ElementType;
  description: string;
}

interface MobileDashboardContentProps {
  totalWeeklySessions: number;
  totalReportsCount: number;
  performanceCards: PerformanceCard[];
  onScheduleClick: () => void;
  onReportsClick: () => void;
}

// Mock chart data for different metrics
const swingSpeedData = [
  { day: "一", value: 85 },
  { day: "二", value: 88 },
  { day: "三", value: 86 },
  { day: "四", value: 92 },
  { day: "五", value: 90 },
  { day: "六", value: 95 },
];

const launchAngleData = [
  { day: "一", value: 12 },
  { day: "二", value: 15 },
  { day: "三", value: 14 },
  { day: "四", value: 18 },
  { day: "五", value: 16 },
  { day: "六", value: 20 },
];

const runSpeedData = [
  { day: "一", value: 7.2 },
  { day: "二", value: 7.4 },
  { day: "三", value: 7.3 },
  { day: "四", value: 7.6 },
  { day: "五", value: 7.5 },
  { day: "六", value: 7.8 },
];

const hitZoneData = [
  { zone: "左", value: 25 },
  { zone: "中左", value: 35 },
  { zone: "中", value: 45 },
  { zone: "中右", value: 30 },
  { zone: "右", value: 20 },
];

const chartConfig: ChartConfig = {
  value: {
    label: "數值",
    color: "hsl(var(--primary))",
  },
};

const MobileDashboardContent = ({
  totalWeeklySessions,
  totalReportsCount,
  performanceCards,
  onScheduleClick,
  onReportsClick,
}: MobileDashboardContentProps) => {
  // Get chart data based on card index
  const getChartForCard = (index: number) => {
    switch (index) {
      case 0: // 揮棒速度
        return (
          <ChartContainer config={chartConfig} className="h-[100px] w-full">
            <AreaChart data={swingSpeedData}>
              <defs>
                <linearGradient id="swingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#swingGradient)" 
              />
            </AreaChart>
          </ChartContainer>
        );
      case 1: // 仰角
        return (
          <ChartContainer config={chartConfig} className="h-[100px] w-full">
            <LineChart data={launchAngleData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        );
      case 2: // 跑速
        return (
          <ChartContainer config={chartConfig} className="h-[100px] w-full">
            <AreaChart data={runSpeedData}>
              <defs>
                <linearGradient id="runGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#runGradient)" 
              />
            </AreaChart>
          </ChartContainer>
        );
      case 3: // 擊球落點
        return (
          <ChartContainer config={chartConfig} className="h-[100px] w-full">
            <BarChart data={hitZoneData}>
              <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick Stats Summary - 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <div 
          className="bg-card rounded-xl border border-border p-4 active:scale-[0.98] transition-transform cursor-pointer"
          onClick={onScheduleClick}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {totalWeeklySessions}
              </div>
              <div className="text-xs text-muted-foreground">本週課程</div>
            </div>
          </div>
        </div>
        <div 
          className="bg-card rounded-xl border border-border p-4 active:scale-[0.98] transition-transform cursor-pointer"
          onClick={onReportsClick}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {totalReportsCount}
              </div>
              <div className="text-xs text-muted-foreground">檢測報告</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Charts with actual charts */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">訓練數據</h2>
        </div>
        
        <div className="space-y-3">
          {performanceCards.map((card, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-2 p-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {card.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    {card.description}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {getChartForCard(idx)}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MobileDashboardContent;
