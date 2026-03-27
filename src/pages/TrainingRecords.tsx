import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Calendar as CalendarIcon, LineChart, ScatterChart, Grid3X3, TrendingUp, Activity, Target } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { PageSection, PageSectionTitle } from "@/components/ui/page-section";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { useAuth } from "@/contexts/AuthContext";
import { useTeams } from "@/contexts/TeamsContext";
import { useStudents } from "@/contexts/StudentsContext";
import { useDataAccess } from "@/hooks/useDataAccess";
import type { DateRange } from "react-day-picker";

// Chart placeholder component
const ChartPlaceholder = ({ 
  title, 
  description, 
  icon: Icon,
  aspectRatio = "16/9" 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType;
  aspectRatio?: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div 
        className="bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20"
        style={{ aspectRatio }}
      >
        <div className="text-center text-muted-foreground">
          <Icon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">圖表區域</p>
          <p className="text-xs">數據載入後顯示</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Daily record placeholder
const DailyRecordPlaceholder = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">當日訓練數據</CardTitle>
      <CardDescription>選擇日期查看詳細訓練紀錄</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const TrainingRecords = () => {
  const { authUser } = useAuth();
  const { teams } = useTeams();
  const { students } = useStudents();
  const { hasFullSiteAccess, accessibleStudentIds } = useDataAccess("schedule");
  
  const isStudent = authUser?.role === "student";
  const showFilters = !isStudent;
  
  // Filter state - simplified to single student selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  // Date range state - use DateRange type for calendar range selection
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [singleDate, setSingleDate] = useState<Date>(new Date());
  
  // View mode: "range" for date range charts, "daily" for single day records
  const [viewMode, setViewMode] = useState<"range" | "daily">("range");
  
  // Popover open state for date range picker
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  
  // Searchable students list filtered by permissions
  const searchableStudents = useMemo(() => {
    return students
      .filter((s) => accessibleStudentIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        teamName: s.teamName,
      }));
  }, [students, accessibleStudentIds]);
  
  // Get selected student for display
  const selectedStudent = useMemo(() => {
    if (isStudent) {
      return students.find((s) => s.email.toLowerCase() === authUser?.email.toLowerCase());
    }
    return students.find((s) => s.id === selectedStudentId);
  }, [isStudent, students, selectedStudentId, authUser?.email]);

  return (
    <AppLayout title="訓練紀錄">
      <div className="p-6 space-y-6">
        {/* Filter Section - Card Style */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">篩選條件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Student Search Filter */}
            {showFilters && (
              <StudentSearchSelect
                students={searchableStudents}
                value={selectedStudentId}
                onChange={setSelectedStudentId}
                placeholder="搜尋學員..."
                allowAllStudents={false}
                className="w-full h-11"
              />
            )}
            
            {/* Row 2: View Mode Toggle */}
            <div>
              <ToggleGroup 
                type="single" 
                value={viewMode} 
                onValueChange={(val) => val && setViewMode(val as "range" | "daily")}
                className="justify-start bg-muted/30 p-1 rounded-lg"
              >
                <ToggleGroupItem 
                  value="daily" 
                  className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm px-6"
                >
                  單日紀錄
                </ToggleGroupItem>
                <ToggleGroupItem 
                  value="range" 
                  className="flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm px-6"
                >
                  區間分析
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            {/* Row 3: Date Selection (conditional based on viewMode) */}
            {viewMode === "range" ? (
              <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal h-11 bg-muted/30"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {dateRange?.from ? format(dateRange.from, "yyyy/MM/dd") : "開始日期"} - {dateRange?.to ? format(dateRange.to, "yyyy/MM/dd") : "結束日期"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                    <div className="flex gap-2 border-t pt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDateRange({
                            from: subDays(new Date(), 7),
                            to: new Date(),
                          });
                          setDateRangeOpen(false);
                        }}
                      >
                        近7天
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDateRange({
                            from: subDays(new Date(), 30),
                            to: new Date(),
                          });
                          setDateRangeOpen(false);
                        }}
                      >
                        近30天
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setDateRange({
                            from: startOfMonth(new Date()),
                            to: endOfMonth(new Date()),
                          });
                          setDateRangeOpen(false);
                        }}
                      >
                        本月
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal h-11 bg-muted/30"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(singleDate, "yyyy年MM月dd日", { locale: zhTW })}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={singleDate}
                    onSelect={(date) => date && setSingleDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </CardContent>
        </Card>
        
        {/* Content Area */}
        {!selectedStudent && !isStudent ? (
          <PageSection>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Activity className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">請選擇學員</h3>
              <p className="text-muted-foreground">
                選擇學員後即可檢視其訓練數據分析
              </p>
            </div>
          </PageSection>
        ) : (
          <>
            {/* Range Analysis Charts */}
            {viewMode === "range" && (
              <div className="space-y-6">
                {/* Hitting Section */}
                <div>
                  <PageSectionTitle unwrapped>打擊數據分析</PageSectionTitle>
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <ChartPlaceholder
                      title="擊球初速趨勢"
                      description="追蹤擊球初速 (Exit Velocity) 的變化趨勢"
                      icon={LineChart}
                    />
                    <ChartPlaceholder
                      title="發射角度分佈"
                      description="發射角度與擊球初速的散布分析"
                      icon={ScatterChart}
                    />
                    <ChartPlaceholder
                      title="擊球落點九宮格"
                      description="擊球落點區域統計"
                      icon={Grid3X3}
                    />
                    <ChartPlaceholder
                      title="甜蜜點命中率"
                      description="擊球品質與進步趨勢"
                      icon={Target}
                    />
                  </div>
                </div>
                
                {/* Pitching Section */}
                <div>
                  <PageSectionTitle unwrapped>投球數據分析</PageSectionTitle>
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <ChartPlaceholder
                      title="球速趨勢"
                      description="各球種球速變化追蹤"
                      icon={TrendingUp}
                    />
                    <ChartPlaceholder
                      title="進壘點分佈"
                      description="各球種進壘位置統計"
                      icon={Grid3X3}
                    />
                    <ChartPlaceholder
                      title="轉速分析"
                      description="各球種轉速 (Spin Rate) 趨勢"
                      icon={LineChart}
                    />
                    <ChartPlaceholder
                      title="球種使用比例"
                      description="訓練中各球種使用分配"
                      icon={Activity}
                    />
                  </div>
                </div>
                
                {/* Physical Training Section */}
                <div>
                  <PageSectionTitle unwrapped>體能訓練數據</PageSectionTitle>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    <ChartPlaceholder
                      title="活動度評估"
                      description="關節活動度測試結果趨勢"
                      icon={Activity}
                      aspectRatio="4/3"
                    />
                    <ChartPlaceholder
                      title="力量測試"
                      description="各項力量指標進步曲線"
                      icon={TrendingUp}
                      aspectRatio="4/3"
                    />
                    <ChartPlaceholder
                      title="爆發力評估"
                      description="垂直跳、橫向移動等測試"
                      icon={LineChart}
                      aspectRatio="4/3"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Daily Records */}
            {viewMode === "daily" && (
              <div className="space-y-6">
                <div>
                  <PageSectionTitle unwrapped>
                    {format(singleDate, "yyyy年MM月dd日", { locale: zhTW })} 訓練紀錄
                  </PageSectionTitle>
                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <DailyRecordPlaceholder />
                    <DailyRecordPlaceholder />
                  </div>
                </div>
                
                <div>
                  <PageSectionTitle unwrapped>當日詳細數據</PageSectionTitle>
                  <Card className="mt-4">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                        <p>選擇日期後將顯示該日的訓練數據表格</p>
                        <p className="text-sm">包含打擊、投球、體能等詳細記錄</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default TrainingRecords;
