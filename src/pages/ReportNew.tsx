import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  Save,
  ChevronDown,
  ChevronUp,
  Lock,
  Loader2,
  CheckCircle2,
  Database,
  CalendarDays,
  FileText,
  X,
  GripVertical,
  Mic,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { getModulesByReportType } from "@/data/reportModules";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import type { Database as SupabaseDB } from "@/integrations/supabase/types";

type ReportType = SupabaseDB["public"]["Enums"]["report_type"];

interface SelectedModule {
  moduleId: string;
  order: number;
}

/** 比較次數：0 單次 / 1 +前一次 / 2 +前兩次 / 3 +前三次 */
type CompareCount = 0 | 1 | 2;

/** 層級基準 */
type LevelBaseline = "國中" | "高中" | "大學" | "職業";

/** 測驗方式 */
type TestMethod = "T座" | "實戰" | "拋打" | "發球機";

const FIXED_SECTIONS: Record<string, { label: string; description: string; dataSource: string }[]> = {
  打擊: [
    { label: "選手個資 + 身體素質", description: "體重、體脂率、骨骼肌重、反向跳、落下跳、藥球側拋、握力、引體向上", dataSource: "體能活動度數據" },
    { label: "揮棒數據", description: "揮棒速度、峰值手腕速度、揮擊時間、攻擊角度、平面重和率等", dataSource: "打擊數據" },
    { label: "擊球數據", description: "擊球初速、仰角、水平角、飛行距離、碰撞效率等", dataSource: "打擊數據" },
    { label: "動作機制查核", description: "14 項打擊機制（綠色勾 / 紅色叉）", dataSource: "打擊機制檢核" },
    { label: "機制說明", description: "針對被標示問題的機制自動生成說明文字", dataSource: "打擊機制檢核" },
  ],
  投球: [
    { label: "選手個資 + 身體素質", description: "體重、體脂率、骨骼肌重、反向跳、落下跳、藥球側拋、握力、引體向上", dataSource: "體能活動度數據" },
    { label: "活動度 + 危險因子", description: "慣用側/非慣用側關節活動度 + GIRD、TAM 等危險因子", dataSource: "體能活動度數據" },
    { label: "球種數據（單次）", description: "各球種的球速、轉速、旋轉效率、位移、出手點等", dataSource: "投球數據" },
    { label: "球種數據（各球種比較）", description: "每球種獨立一頁，呈現當次 vs 前次比較", dataSource: "投球數據" },
    { label: "動作機制查核", description: "26 項投球機制（綠色勾 / 紅色叉）", dataSource: "投球機制檢核" },
    { label: "機制說明", description: "針對被標示問題的機制自動生成說明文字", dataSource: "投球機制檢核" },
  ],
};

const MOCK_TEST_DATES: Record<string, string[]> = {
  打擊: ["2026/03/20", "2026/02/15", "2026/01/10", "2025/12/05"],
  投球: ["2026/03/18", "2026/02/10", "2026/01/08", "2025/11/20"],
};

const ReportNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const { filteredStudents } = useDataAccess("reports");
  const { students } = useStudents();
  const { teams } = useTeams();

  // Step 1
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [testDate, setTestDate] = useState("");
  const [compareCount, setCompareCount] = useState<CompareCount>(1);
  const [levelBaseline, setLevelBaseline] = useState<LevelBaseline>("高中");
  const [testMethod, setTestMethod] = useState<TestMethod>("實戰");
  const [reportTitle, setReportTitle] = useState("");

  // Step 2: 圖表（選擇 + 排序合併）
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);

  // Step 3: 個人化建議（語音轉文字或手動輸入，空白時 PDF 輸出不顯示）
  const [personalAdvice, setPersonalAdvice] = useState("");

  // UI
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableModules = useMemo(() => {
    if (!reportType) return [];
    return getModulesByReportType(reportType as "打擊" | "投球");
  }, [reportType]);

  const fixedSections = reportType ? FIXED_SECTIONS[reportType] || [] : [];

  const searchableStudents = useMemo(() => {
    return filteredStudents.map((s) => {
      const team = teams.find((t) => t.id === s.team_id);
      return { id: s.id, name: s.name, teamName: team?.name || "" };
    });
  }, [filteredStudents, teams]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return null;
    const team = teams.find((t) => t.id === student.team_id);
    return { ...student, teamName: team?.name || "" };
  }, [selectedStudentId, students, teams]);

  const availableDates = useMemo(() => {
    if (!reportType) return [];
    return MOCK_TEST_DATES[reportType] || [];
  }, [reportType]);

  /** 依 compareCount 自動推算前 N 次日期（測驗日期下拉是遞減排序） */
  const previousDates = useMemo<string[]>(() => {
    if (!testDate || compareCount === 0) return [];
    const idx = availableDates.indexOf(testDate);
    if (idx < 0) return [];
    return availableDates.slice(idx + 1, idx + 1 + compareCount);
  }, [testDate, compareCount, availableDates]);

  const isDataLoaded = !!reportType && !!selectedStudentId && !!testDate;

  // 勾選 → 加到最後；取消 → 移除並重新排序
  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedModules((prev) => [...prev, { moduleId, order: prev.length + 1 }]);
    } else {
      setSelectedModules((prev) =>
        prev.filter((m) => m.moduleId !== moduleId).map((m, i) => ({ ...m, order: i + 1 }))
      );
    }
  };

  const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
    setSelectedModules((prev) => {
      const idx = prev.findIndex((m) => m.moduleId === moduleId);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next.map((m, i) => ({ ...m, order: i + 1 }));
    });
  };

  const handleRemoveModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.filter((m) => m.moduleId !== moduleId).map((m, i) => ({ ...m, order: i + 1 }))
    );
  };

  const handleReportTypeChange = (value: string) => {
    setReportType(value as ReportType);
    setSelectedModules([]);
    setTestDate("");
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setTestDate("");
  };

  const isStep1Complete = isDataLoaded;
  const canGenerate = isStep1Complete && selectedModules.length > 0;

  // Preview pages
  const previewPages = useMemo(() => {
    const pages: { label: string; type: "fixed" | "chart" }[] = [];
    fixedSections.forEach((s) => pages.push({ label: s.label, type: "fixed" }));
    if (selectedModules.length > 0) {
      const chartPageCount = Math.ceil(selectedModules.length / 2);
      for (let i = 0; i < chartPageCount; i++) {
        const names = selectedModules
          .slice(i * 2, i * 2 + 2)
          .map((m) => availableModules.find((am) => am.id === m.moduleId)?.name || m.moduleId)
          .join("、");
        pages.push({
          label: chartPageCount > 1 ? `圖表分析 (${i + 1}/${chartPageCount})：${names}` : `圖表分析：${names}`,
          type: "chart",
        });
      }
    }
    return pages;
  }, [fixedSections, selectedModules, availableModules]);

  const handleGenerateReport = async () => {
    if (!canGenerate || !selectedStudent || !reportType) return;
    setIsSubmitting(true);

    const id = crypto.randomUUID();
    const title = reportTitle || `${selectedStudent.name} - ${reportType}檢測報告`;
    const moduleConfig = {
      modules: selectedModules.map((m) => {
        const mod = availableModules.find((am) => am.id === m.moduleId);
        return { module_id: m.moduleId, module_name: mod?.name || m.moduleId, order: m.order };
      }),
    };
    const chartData = {
      test_date: testDate,
      compare_count: compareCount,
      previous_dates: previousDates,
      level_baseline: levelBaseline,
      test_method: testMethod,
    };

    try {
      const { error } = await supabase.from("reports").insert({
        id,
        date: testDate.replace(/\//g, "-"),
        student_id: selectedStudentId,
        type: reportType as "打擊" | "投球",
        title,
        module_config: moduleConfig as unknown as Record<string, unknown>,
        markdown_notes: personalAdvice.trim() || null,
        student_snapshot: { name: selectedStudent.name, team: selectedStudent.teamName } as unknown as Record<string, unknown>,
        chart_data: chartData as unknown as Record<string, unknown>,
        coach_id: authUser?.id || null,
      });
      if (error) throw error;
      toast({ title: "報告已建立", description: title });
      navigate(`/reports/${id}`);
    } catch (err) {
      toast({ title: "建立失敗", description: err instanceof Error ? err.message : "請稍後再試", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout
      title="新增檢測報告"
      headerAction={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} disabled={!isStep1Complete}>
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? "隱藏預覽" : "顯示預覽"}
          </Button>
          <Button onClick={handleGenerateReport} disabled={!canGenerate || isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            產生報告
          </Button>
        </div>
      }
    >
      <div className="h-[calc(100vh-72px)] -m-8">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={showPreview && isStep1Complete ? 55 : 100}>
            <div className="overflow-y-auto h-full p-8 space-y-6">
              <PageBreadcrumb items={[{ label: "檢測報告", path: "/reports" }, { label: "新增報告" }]} />

              {/* ═══ Step 1: 選擇條件 ═══ */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
                    <CardTitle className="text-lg">選擇檢測條件</CardTitle>
                  </div>
                  <CardDescription>系統將根據學員、報告類型、檢測日期從資料庫中載入數據</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>報告類型 <span className="text-destructive">*</span></Label>
                      <Select value={reportType} onValueChange={handleReportTypeChange}>
                        <SelectTrigger><SelectValue placeholder="選擇報告類型" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="打擊">打擊報告</SelectItem>
                          <SelectItem value="投球">投球報告</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>選擇學員 <span className="text-destructive">*</span></Label>
                      <StudentSearchSelect students={searchableStudents} value={selectedStudentId} onChange={handleStudentChange} placeholder="搜尋學員..." className="w-full" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>檢測日期 <span className="text-destructive">*</span></Label>
                      <Select value={testDate} onValueChange={setTestDate} disabled={!reportType || !selectedStudentId}>
                        <SelectTrigger>
                          <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder={!reportType || !selectedStudentId ? "請先選擇類型與學員" : "選擇檢測日期"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDates.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>比較模式</Label>
                      <Select value={String(compareCount)} onValueChange={(v) => setCompareCount(Number(v) as CompareCount)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">僅本次檢測</SelectItem>
                          <SelectItem value="1">連同前一次檢測</SelectItem>
                          <SelectItem value="2">連同前兩次檢測</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>比較層級基準</Label>
                      <Select value={levelBaseline} onValueChange={(v) => setLevelBaseline(v as LevelBaseline)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="國中">國中</SelectItem>
                          <SelectItem value="高中">高中</SelectItem>
                          <SelectItem value="大學">大學</SelectItem>
                          <SelectItem value="職業">職業</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">用於層級平均 ± 0.5SD 的比較基準</p>
                    </div>
                    <div className="space-y-2">
                      <Label>測驗方式</Label>
                      <Select value={testMethod} onValueChange={(v) => setTestMethod(v as TestMethod)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="實戰">實戰</SelectItem>
                          <SelectItem value="T座">T座</SelectItem>
                          <SelectItem value="拋打">拋打</SelectItem>
                          <SelectItem value="發球機">發球機</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">比較前次時僅抓取相同測驗方式的數據</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>報告標題（選填）</Label>
                    <Input
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      placeholder={selectedStudent && reportType && testDate ? `${selectedStudent.name} - ${reportType}報告 - ${testDate}` : "自動產生或手動輸入"}
                    />
                  </div>

                  {isDataLoaded ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-green-700 dark:text-green-400">數據已載入</span>
                        <span className="text-muted-foreground ml-2">
                          {selectedStudent?.name} · {reportType} · {testDate}
                          {previousDates.length > 0 && ` （比較：${previousDates.join("、")}）`}
                          {` · ${testMethod} · 對比${levelBaseline}`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-500/30">
                        <Database className="w-3 h-3 mr-1" />已 Query
                      </Badge>
                    </div>
                  ) : selectedStudent ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">選擇檢測日期後將自動載入該次檢測數據</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* ═══ Step 2: 確認資料 + 圖表選擇/排序（合併） ═══ */}
              {isStep1Complete ? (
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</div>
                      <CardTitle className="text-lg">確認資料 & 選擇圖表</CardTitle>
                    </div>
                    <CardDescription>固定區塊已從資料庫載入，勾選圖表模組後可直接排序</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* 固定區塊 */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">固定區塊（由資料庫載入）</h4>
                      <div className="space-y-1.5">
                        {fixedSections.map((section, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                            <Lock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-foreground">{section.label}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">{section.dataSource}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* 圖表模組：左右分欄 — 左選右排 */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        圖表模組
                        {selectedModules.length > 0 && (
                          <span className="ml-2 text-xs font-normal">({selectedModules.length}/{availableModules.length})</span>
                        )}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 左欄：可選圖表 */}
                        <div className="rounded-lg border border-border p-4 space-y-2">
                          <h5 className="text-sm font-medium mb-2">可選圖表</h5>
                          {availableModules.map((mod) => {
                            const isSelected = selectedModules.some((m) => m.moduleId === mod.id);
                            return (
                              <div
                                key={mod.id}
                                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                                  isSelected
                                    ? "border-primary/30 bg-primary/5 opacity-50"
                                    : "border-border/50 hover:bg-muted/50 cursor-pointer"
                                }`}
                                onClick={() => !isSelected && handleModuleToggle(mod.id, true)}
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium">{mod.name}</span>
                                  {mod.status === "pending_data" && (
                                    <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">待數據</Badge>
                                  )}
                                </div>
                                {!isSelected ? (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={(e) => { e.stopPropagation(); handleModuleToggle(mod.id, true); }}>
                                    <span className="text-lg leading-none">+</span>
                                  </Button>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">已選</Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 右欄：已選圖表（拖拉排序） */}
                        <div className="rounded-lg border border-border p-4">
                          <h5 className="text-sm font-medium mb-2">已選圖表（拖拉排序）</h5>
                          {selectedModules.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
                              從左側點擊 + 加入圖表
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {selectedModules.map((sel, idx) => {
                                const mod = availableModules.find((m) => m.id === sel.moduleId);
                                if (!mod) return null;
                                return (
                                  <div key={sel.moduleId} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card">
                                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-medium text-muted-foreground w-5">{idx + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium">{mod.name}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveModule(sel.moduleId, "up")} disabled={idx === 0}>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveModule(sel.moduleId, "down")} disabled={idx === selectedModules.length - 1}>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => handleRemoveModule(sel.moduleId)}>
                                      <X className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="opacity-50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm font-bold">2</div>
                      <CardTitle className="text-lg">確認資料 & 選擇圖表</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">請先完成步驟 1 以載入檢測數據</p>
                  </CardContent>
                </Card>
              )}

              {/* ═══ Step 3: 個人化建議 ═══ */}
              <Card className={!isStep1Complete ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      isStep1Complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>3</div>
                    <CardTitle className="text-lg">個人化建議（選填）</CardTitle>
                  </div>
                  <CardDescription>
                    可上傳教練錄音檔自動轉文字，或直接輸入文字內容。空白時 PDF 輸出不顯示此區塊。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Mic className="w-3.5 h-3.5 mr-1.5" />
                      上傳錄音檔（AI 轉文字）
                    </Button>
                    <span className="text-xs text-muted-foreground">或直接在下方輸入</span>
                  </div>
                  <Textarea
                    value={personalAdvice}
                    onChange={(e) => setPersonalAdvice(e.target.value)}
                    placeholder="輸入個人化建議內容，或上傳錄音檔由 AI 自動轉文字後再編輯..."
                    className="min-h-[120px] text-sm resize-none"
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-3 h-3" />
                    <span>未來將支援從 iPhone 錄音程式直接選取檔案上傳</span>
                  </div>
                </CardContent>
              </Card>

              {/* 底部 */}
              <div className="flex items-center justify-between pb-8">
                <Button variant="outline" onClick={() => navigate("/reports")}>取消</Button>
                <Button onClick={handleGenerateReport} disabled={!canGenerate || isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  產生報告
                </Button>
              </div>
            </div>
          </ResizablePanel>

          {/* ═══ 預覽面板 ═══ */}
          {showPreview && isStep1Complete && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={45} minSize={20} maxSize={55}>
                <div className="bg-muted/30 overflow-y-auto h-full p-6 space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    報告頁面預覽
                  </h3>
                  <Separator />

                  {selectedStudent && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">學員</span><span className="font-medium">{selectedStudent.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">學校</span><span>{selectedStudent.teamName}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">報告類型</span><Badge variant="outline">{reportType}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">檢測日期</span><span className="font-medium">{testDate}</span></div>
                      {previousDates.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">比較日期</span>
                          <span className="text-muted-foreground text-right">{previousDates.join("、")}</span>
                        </div>
                      )}
                      <div className="flex justify-between"><span className="text-muted-foreground">層級基準</span><Badge variant="outline">{levelBaseline}</Badge></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">測驗方式</span><Badge variant="outline">{testMethod}</Badge></div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">報告頁面順序（共 {previewPages.length} 頁）</h4>
                    <div className="space-y-1.5">
                      {previewPages.map((page, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm ${
                            page.type === "fixed" ? "bg-muted/40 border-border/50" : "bg-primary/5 border-primary/30"
                          }`}
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-foreground/10 text-xs font-bold flex-shrink-0">{idx + 1}</span>
                          <span className="flex-1 min-w-0 truncate">
                            {page.type === "fixed" && <Lock className="inline w-3 h-3 mr-1 text-muted-foreground" />}
                            {page.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedModules.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">圖表模組預覽</h4>
                        {selectedModules.map((sel) => {
                          const mod = availableModules.find((m) => m.id === sel.moduleId);
                          if (!mod) return null;
                          return <ChartModuleCard key={sel.moduleId} module={mod} />;
                        })}
                      </div>
                    </>
                  )}
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </AppLayout>
  );
};

export default ReportNew;
