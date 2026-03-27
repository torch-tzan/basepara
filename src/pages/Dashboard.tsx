import { useMemo } from "react";
import { Calendar, LineChart, BarChart3, Target, FileText, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDataAccess } from "@/hooks/useDataAccess";
import WeeklyCalendar from "@/components/dashboard/WeeklyCalendar";
import { format } from "date-fns";
import MobileDashboardContent from "@/components/dashboard/MobileDashboardContent";
import { useScheduleEvents, type ScheduleEventWithDetails } from "@/hooks/useSupabaseSchedule";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from "@/components/ui/chart";
import { LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, XAxis, Area, AreaChart } from "recharts";

// Helper to calculate weekly sessions for mobile dashboard
const calculateWeeklySessions = (
  events: Record<string, ScheduleEventWithDetails[]>, 
  isStudent: boolean, 
  studentId?: string,
  accessibleStudentIds?: string[]
): number => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  let total = 0;
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(sunday);
    currentDate.setDate(sunday.getDate() + i);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dayNumber = currentDate.getDate();
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    
    const dayEvents = events[dateKey] || [];
    let filteredEvents = dayEvents;
    
    if (isStudent && studentId) {
      filteredEvents = dayEvents.filter(e => e.studentId === studentId);
    } else if (accessibleStudentIds) {
      filteredEvents = dayEvents.filter(e => accessibleStudentIds.includes(e.studentId));
    }
    
    total += filteredEvents.length;
  }
  return total;
};

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

// Get chart component based on card index
const getStudentChart = (index: number, height: string = "h-[160px]") => {
  switch (index) {
    case 0: // 揮棒速度
      return (
        <ChartContainer config={chartConfig} className={`${height} w-full`}>
          <AreaChart data={swingSpeedData}>
            <defs>
              <linearGradient id="swingGradientDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#swingGradientDesktop)" 
            />
          </AreaChart>
        </ChartContainer>
      );
    case 1: // 仰角
      return (
        <ChartContainer config={chartConfig} className={`${height} w-full`}>
          <RechartsLineChart data={launchAngleData}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      );
    case 2: // 跑速
      return (
        <ChartContainer config={chartConfig} className={`${height} w-full`}>
          <AreaChart data={runSpeedData}>
            <defs>
              <linearGradient id="runGradientDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              fill="url(#runGradientDesktop)" 
            />
          </AreaChart>
        </ChartContainer>
      );
    case 3: // 擊球落點
      return (
        <ChartContainer config={chartConfig} className={`${height} w-full`}>
          <RechartsBarChart data={hitZoneData}>
            <XAxis dataKey="zone" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar 
              dataKey="value" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      );
    default:
      return null;
  }
};

// Report type summaries for display
const reportSummaries: Record<string, string> = {
  "打擊": "揮棒速度提升明顯,仰角控制穩定,建議持續加強下半身力量訓練以提升整體表現。",
  "投球": "球速穩定維持在水準之上,控球精準度有所提升,建議注意投球姿勢避免運動傷害。",
  "體測": "跑速較上次測驗進步5%,爆發力表現優異,體能狀態良好可進行高強度訓練。",
};

const coachPerformanceCards = [
  { title: "平均揮棒速度 (km/h)", icon: LineChart, description: "學員揮棒速度統計" },
  { title: "平均仰角 (度)", icon: BarChart3, description: "學員仰角分析" },
  { title: "平均跑速 (m/s)", icon: LineChart, description: "學員跑速統計" },
  { title: "擊球落點分布", icon: Target, description: "學員擊球落點統計" },
];

const studentPerformanceCards = [
  { title: "揮棒速度 (km/h)", icon: LineChart, description: "揮棒速度趨勢圖" },
  { title: "仰角 (度)", icon: BarChart3, description: "仰角分析圖" },
  { title: "跑速 (m/s)", icon: LineChart, description: "跑速統計圖" },
  { title: "擊球落點", icon: Target, description: "擊球落點分布圖" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const isMobile = useIsMobile();
  const isStudent = authUser?.role === "student";
  
  // Get accessible student IDs and reports based on permissions
  const { accessibleStudentIds, filteredReports } = useDataAccess("reports");
  const { accessibleStudentIds: scheduleAccessibleIds } = useDataAccess("schedule");

  // Fetch schedule events from Supabase (only for mobile stats)
  const { data: scheduleEventsData } = useScheduleEvents();

  // Calculate weekly sessions for mobile dashboard
  const totalWeeklySessions = useMemo(() => {
    const events = scheduleEventsData || {};
    const studentId = isStudent ? scheduleAccessibleIds[0] : undefined;
    return calculateWeeklySessions(events, isStudent, studentId, isStudent ? undefined : scheduleAccessibleIds);
  }, [isStudent, scheduleAccessibleIds, scheduleEventsData]);

  // Transform real reports to display format (latest 3)
  const latestReports = useMemo(() => {
    return filteredReports.slice(0, 3).map((report) => ({
      date: format(new Date(report.date), "yyyy/MM/dd"),
      category: report.type,
      summary: reportSummaries[report.type] || "檢測報告摘要",
    }));
  }, [filteredReports]);

  // Total report count for mobile dashboard
  const totalReportsCount = filteredReports.length;

  const performanceCards = isStudent ? studentPerformanceCards : coachPerformanceCards;
  const title = isStudent ? "個人訓練儀表板" : "教練儀表板";

  // Mobile student dashboard
  if (isMobile && isStudent) {
    return (
      <AppLayout title={title}>
        <MobileDashboardContent
          totalWeeklySessions={totalWeeklySessions}
          totalReportsCount={totalReportsCount}
          performanceCards={performanceCards}
          onScheduleClick={() => {
            const today = new Date();
            navigate(`/schedule?year=${today.getFullYear()}&month=${today.getMonth() + 1}`);
          }}
          onReportsClick={() => navigate("/reports")}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={title}>
      <div className="space-y-6 md:space-y-8">
        {/* Weekly Schedule */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-medium text-foreground">本週課表</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs md:text-sm"
              onClick={() => {
                // Navigate to schedule with today's date
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;
                navigate(`/schedule?year=${year}&month=${month}`);
              }}
            >
              <Calendar className="w-4 h-4" />
              {!isMobile && "查看課表"}
            </Button>
          </div>
          <WeeklyCalendar 
            showStudentInfo={!isStudent}
            compact={isMobile}
          />
        </section>

        {/* Latest Reports - Student Only */}
        {isStudent && (
          <section>
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h2 className="text-base md:text-lg font-medium text-foreground">最新檢測報告</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-xs md:text-sm"
                onClick={() => navigate("/reports")}
              >
                <FileText className="w-4 h-4" />
                {!isMobile && "所有報告"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {latestReports.map((report, idx) => (
                <Card key={idx} className="hover:border-muted-foreground/30 cursor-pointer transition-all">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div className="text-xs md:text-sm text-muted-foreground">{report.date}</div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 -mr-2 -mt-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="mb-2 md:mb-3">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {report.category}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                      {report.summary}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Performance Charts */}
        <section>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-medium text-foreground">
              {isStudent ? "訓練數據圖表" : "學員層級比較"}
            </h2>
            <Button variant="outline" size="sm" className="text-xs md:text-sm">
              選擇模組
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {performanceCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Card key={card.title}>
                  <CardHeader className="pb-2 p-4 md:p-6 md:pb-2">
                    <CardTitle className="text-sm md:text-lg font-medium flex items-center justify-between">
                      {card.title}
                      <span className="text-xs font-normal text-muted-foreground">
                        {card.description}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
                    {isStudent ? (
                      getStudentChart(idx, "h-[140px] md:h-[180px]")
                    ) : (
                      <div className="h-32 md:h-48 bg-accent rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Icon className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground/50 mx-auto mb-2" />
                          <div className="text-muted-foreground text-xs md:text-sm">{card.description}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
