import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  ChevronUp,
  Lock,
  CheckCircle2,
  Database,
  CalendarDays,
  X,
  GripVertical,
  Mic,
  Upload,
} from "lucide-react";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { getModulesByReportType } from "@/data/reportModules";
import type { Database as SupabaseDB } from "@/integrations/supabase/types";

type ReportType = SupabaseDB["public"]["Enums"]["report_type"];

interface SelectedModule {
  moduleId: string;
  order: number;
}

/** 比較次數：0 單次 / 1 +前一次 / 2 +前兩次 */
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

/**
 * Mock：當日檢測方式資料
 * 依 (reportType, date) 回傳該日實際採用的測驗方式清單
 * 實際上線後由後端 / Supabase 依 (student_id, date) 查詢
 * - 投球類：一律為「實戰」（投球僅有實戰）
 * - 打擊類：依日期不同可能為單一方式或多種方式
 */
const MOCK_TEST_METHODS_BY_DATE: Record<string, Record<string, TestMethod[]>> = {
  打擊: {
    "2026/03/20": ["實戰", "T座"],         // 當日有兩種
    "2026/02/15": ["T座"],                  // 單一
    "2026/01/10": ["實戰", "拋打", "發球機"], // 多種
    "2025/12/05": ["實戰"],                 // 單一
  },
  投球: {
    "2026/03/18": ["實戰"],
    "2026/02/10": ["實戰"],
    "2026/01/08": ["實戰"],
    "2025/11/20": ["實戰"],
  },
};

/** sessionStorage key — 暫存表單資料，供預覽頁讀取 */
export const REPORT_NEW_DRAFT_KEY = "basepara:report-new-draft";

export interface ReportDraft {
  reportType: ReportType;
  selectedStudentId: string;
  studentName: string;
  studentTeamName: string;
  testDate: string;
  compareCount: CompareCount;
  levelBaseline: LevelBaseline;
  testMethod: TestMethod;
  previousDates: string[];
  selectedModules: SelectedModule[];
  personalAdvice: string;
  /** 自動產生的標題 */
  autoTitle: string;
}

const ReportNew = () => {
  const navigate = useNavigate();
  const { filteredStudents } = useDataAccess("reports");
  const { students } = useStudents();
  const { teams } = useTeams();

  // 基本條件
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [testDate, setTestDate] = useState("");
  const [testMethod, setTestMethod] = useState<TestMethod>("實戰");
  const [levelBaseline, setLevelBaseline] = useState<LevelBaseline>("高中");
  const [compareCount, setCompareCount] = useState<CompareCount>(1);

  // 圖表模組
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);

  // 教練回覆
  const [personalAdvice, setPersonalAdvice] = useState("");

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

  /** 依選擇日期查出當日可用的測驗方式清單 */
  const availableTestMethods = useMemo<TestMethod[]>(() => {
    if (!reportType || !testDate) return [];
    return MOCK_TEST_METHODS_BY_DATE[reportType]?.[testDate] || [];
  }, [reportType, testDate]);

  /** 當日期變動時，自動帶入當日的測驗方式；若只有一種則固定該值 */
  useEffect(() => {
    if (availableTestMethods.length === 0) return;
    // 若目前值不在當日可用清單，改為第一個
    if (!availableTestMethods.includes(testMethod)) {
      setTestMethod(availableTestMethods[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTestMethods]);

  const previousDates = useMemo<string[]>(() => {
    if (!testDate || compareCount === 0) return [];
    const idx = availableDates.indexOf(testDate);
    if (idx < 0) return [];
    return availableDates.slice(idx + 1, idx + 1 + compareCount);
  }, [testDate, compareCount, availableDates]);

  const isDataLoaded = !!reportType && !!selectedStudentId && !!testDate;
  const isStep1Complete = isDataLoaded;
  const canPreview = isStep1Complete && selectedModules.length > 0;

  // 自動產生標題
  const autoTitle = useMemo(() => {
    if (!selectedStudent || !reportType || !testDate) return "";
    return `${testDate} · ${selectedStudent.name} · ${reportType}報告`;
  }, [selectedStudent, reportType, testDate]);

  const handleReportTypeChange = (value: string) => {
    setReportType(value as ReportType);
    setSelectedModules([]);
    setTestDate("");
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setTestDate("");
  };

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

  // 拖曳排序：HTML5 drag & drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, moduleId: string) => {
    setDraggingId(moduleId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverId !== moduleId) setDragOverId(moduleId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = draggingId;
    setDraggingId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;
    setSelectedModules((prev) => {
      const srcIdx = prev.findIndex((m) => m.moduleId === sourceId);
      const tgtIdx = prev.findIndex((m) => m.moduleId === targetId);
      if (srcIdx < 0 || tgtIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, moved);
      return next.map((m, i) => ({ ...m, order: i + 1 }));
    });
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
  };

  /** 點擊「顯示預覽」— 將草稿存入 sessionStorage 後導到預覽頁 */
  const handleShowPreview = () => {
    if (!canPreview || !selectedStudent || !reportType) return;
    const draft: ReportDraft = {
      reportType: reportType as ReportType,
      selectedStudentId,
      studentName: selectedStudent.name,
      studentTeamName: selectedStudent.teamName,
      testDate,
      compareCount,
      levelBaseline,
      testMethod,
      previousDates,
      selectedModules,
      personalAdvice: personalAdvice.trim(),
      autoTitle,
    };
    sessionStorage.setItem(REPORT_NEW_DRAFT_KEY, JSON.stringify(draft));
    navigate("/reports/new/preview");
  };

  return (
    <AppLayout title="新增檢測報告">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageBreadcrumb items={[{ label: "檢測報告", path: "/reports" }, { label: "新增報告" }]} />

        {/* ═══ Step 1: 選擇條件（3 行 × 3 欄） ═══ */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</div>
              <CardTitle className="text-lg">選擇檢測條件</CardTitle>
            </div>
            <CardDescription>系統將根據學員、報告類型、檢測日期從資料庫載入數據</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ── 第一行：報告類型（1/3） ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>報告類型 <span className="text-destructive">*</span></Label>
                <Select value={reportType} onValueChange={handleReportTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇報告類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="打擊">打擊報告</SelectItem>
                    <SelectItem value="投球">投球報告</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── 第二行：學員 / 檢測日期 / 測驗方式（各 1/3） ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>選擇學員 <span className="text-destructive">*</span></Label>
                <StudentSearchSelect
                  students={searchableStudents}
                  value={selectedStudentId}
                  onChange={handleStudentChange}
                  placeholder="搜尋學員..."
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>檢測日期 <span className="text-destructive">*</span></Label>
                <Select value={testDate} onValueChange={setTestDate} disabled={!reportType || !selectedStudentId}>
                  <SelectTrigger>
                    <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder={!reportType || !selectedStudentId ? "請先選擇類型與學員" : "選擇檢測日期"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>測驗方式</Label>
                <Select
                  value={testMethod}
                  onValueChange={(v) => setTestMethod(v as TestMethod)}
                  disabled={!testDate || availableTestMethods.length <= 1}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!testDate ? "請先選擇檢測日期" : "選擇測驗方式"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTestMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {!testDate
                    ? "依當日檢測資料自動帶入"
                    : availableTestMethods.length === 1
                    ? `當日僅有「${availableTestMethods[0]}」檢測`
                    : `當日有 ${availableTestMethods.length} 種檢測方式，可切換`}
                </p>
              </div>
            </div>

            {/* ── 第三行：比較層級基準 / 比較模式（各 1/3） ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* 狀態提示（自動標題、資料已載入） */}
            {isDataLoaded ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-green-700 dark:text-green-400">數據已載入</span>
                  <span className="text-muted-foreground ml-2">
                    {autoTitle}
                    {previousDates.length > 0 && `（比較：${previousDates.join("、")}）`}
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

        {/* ═══ Step 2: 確認資料 + 圖表選擇 ═══ */}
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

              {/* 圖表模組 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  圖表模組
                  {selectedModules.length > 0 && (
                    <span className="ml-2 text-xs font-normal">({selectedModules.length}/{availableModules.length})</span>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 左欄：可選 */}
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModuleToggle(mod.id, true);
                              }}
                            >
                              <span className="text-lg leading-none">+</span>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">已選</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 右欄：已選 */}
                  <div className="rounded-lg border border-border p-4">
                    <h5 className="text-sm font-medium mb-2">已選圖表（可排序）</h5>
                    {selectedModules.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg">
                        從左側點擊 + 加入圖表
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {selectedModules.map((sel, idx) => {
                          const mod = availableModules.find((m) => m.id === sel.moduleId);
                          if (!mod) return null;
                          const isDragging = draggingId === sel.moduleId;
                          const isDragOver = dragOverId === sel.moduleId && draggingId !== sel.moduleId;
                          return (
                            <div
                              key={sel.moduleId}
                              draggable
                              onDragStart={(e) => handleDragStart(e, sel.moduleId)}
                              onDragOver={(e) => handleDragOver(e, sel.moduleId)}
                              onDrop={(e) => handleDrop(e, sel.moduleId)}
                              onDragEnd={handleDragEnd}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-lg border bg-card transition-all",
                                isDragging ? "opacity-40 border-primary" : "border-border",
                                isDragOver && "border-primary border-2 bg-primary/5"
                              )}
                            >
                              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" />
                              <span className="text-sm font-medium text-muted-foreground w-5">{idx + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium">{mod.name}</span>
                              </div>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMoveModule(sel.moduleId, "up")}
                                  disabled={idx === 0}
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleMoveModule(sel.moduleId, "down")}
                                  disabled={idx === selectedModules.length - 1}
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                                onClick={() => handleRemoveModule(sel.moduleId)}
                              >
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

        {/* ═══ Step 3: 教練回覆（選填） ═══ */}
        <Card className={!isStep1Complete ? "opacity-50 pointer-events-none" : ""}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                isStep1Complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>3</div>
              <CardTitle className="text-lg">教練回覆（選填）</CardTitle>
            </div>
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
              placeholder="輸入教練回覆內容，或上傳錄音檔由 AI 自動轉文字後再編輯..."
              className="min-h-[120px] text-sm resize-none"
            />
          </CardContent>
        </Card>

        {/* ═══ 底部：取消 / 顯示預覽 ═══ */}
        <div className="flex items-center justify-between pb-8">
          <Button variant="outline" onClick={() => navigate("/reports")}>取消</Button>
          <Button onClick={handleShowPreview} disabled={!canPreview}>
            <Eye className="w-4 h-4 mr-2" />
            顯示預覽
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportNew;
