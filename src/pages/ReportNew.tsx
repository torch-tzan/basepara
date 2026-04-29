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
  CheckCircle2,
  Database,
  CalendarDays,
  X,
  GripVertical,
  Mic,
  Upload,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { getModulesByReportType } from "@/data/reportModules";
import { getLevelOptionsByAttribute, LEVEL_OPTIONS_BY_ATTRIBUTE } from "@/data/teamsConfig";
import type { Database as SupabaseDB } from "@/integrations/supabase/types";

type ReportType = SupabaseDB["public"]["Enums"]["report_type"];

interface SelectedModule {
  moduleId: string;
  order: number;
}

/** 比較次數：0 單次 / 1 +前一次 / 2 +前兩次 */
type CompareCount = 0 | 1 | 2;

/** 層級基準 — 棒球 9 種 + 壘球 2 種；用 string 容納所有可能值 */
type LevelBaseline = string;

/** 測驗方式 */
type TestMethod = "T座" | "實戰" | "拋打" | "發球機";

/**
 * 固定區塊：每個 key 對應 ReportView 的 hasSection() 檢查（fitness/mobility/swing/hitting/pitch/mechanics）。
 * key 寫入 chart_data.missing_sections — 教練若關閉某區塊，產出的報告會自動跳過渲染。
 */
const FIXED_SECTIONS: Record<string, { key: string; label: string; description: string; dataSource: string }[]> = {
  打擊: [
    { key: "fitness", label: "選手個資 + 身體素質", description: "體重、體脂率、骨骼肌重、反向跳、落下跳、藥球側拋、握力、引體向上", dataSource: "體能活動度數據" },
    { key: "swing", label: "揮棒數據", description: "揮棒速度、峰值手腕速度、揮擊時間、攻擊角度、平面重和率等", dataSource: "打擊數據" },
    { key: "hitting", label: "擊球數據", description: "擊球初速、仰角、水平角、飛行距離、碰撞效率等", dataSource: "打擊數據" },
    { key: "mechanics", label: "動作機制查核 + 機制說明", description: "14 項打擊機制（綠色勾 / 紅色叉）+ 針對被標示問題的機制自動生成說明文字", dataSource: "打擊機制檢核" },
  ],
  投球: [
    { key: "fitness", label: "選手個資 + 身體素質", description: "體重、體脂率、骨骼肌重、反向跳、落下跳、藥球側拋、握力、引體向上", dataSource: "體能活動度數據" },
    { key: "mobility", label: "活動度 + 危險因子", description: "慣用側/非慣用側關節活動度 + GIRD、TAM 等危險因子", dataSource: "體能活動度數據" },
    { key: "pitch", label: "球種數據", description: "各球種的球速、轉速、旋轉效率、位移、出手點等（含單次與各球種比較）", dataSource: "投球數據" },
    { key: "mechanics", label: "動作機制查核 + 機制說明", description: "26 項投球機制（綠色勾 / 紅色叉）+ 針對被標示問題的機制自動生成說明文字", dataSource: "投球機制檢核" },
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
  /** 被關閉的固定區塊 key 清單（寫入 chart_data.missing_sections） */
  excludedSections: string[];
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
  /**
   * 層級基準預設「高中甲組」（棒球體系最常見）；切換到壘球學員時 useEffect 會自動 reset
   * 為「慢速壘球」（LEVEL_OPTIONS_BY_ATTRIBUTE.softball[0]）
   */
  const [levelBaseline, setLevelBaseline] = useState<LevelBaseline>("高中甲組");
  const [compareCount, setCompareCount] = useState<CompareCount>(1);

  // 圖表模組
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);

  // 固定區塊開關（被關閉的 key 集合，預設全部顯示 = 空 Set）
  const [excludedSections, setExcludedSections] = useState<Set<string>>(new Set());

  // 教練回覆
  const [personalAdvice, setPersonalAdvice] = useState("");

  const availableModules = useMemo(() => {
    if (!reportType) return [];
    return getModulesByReportType(reportType as "打擊" | "投球");
  }, [reportType]);

  const fixedSections = reportType ? FIXED_SECTIONS[reportType] || [] : [];

  const searchableStudents = useMemo(() => {
    return filteredStudents.map((s) => ({
      id: s.id,
      name: s.name,
      teamName: s.teamName || teams.find((t) => t.id === s.teamId)?.name || "",
      level: s.level || teams.find((t) => t.id === s.teamId)?.level || "",
    }));
  }, [filteredStudents, teams]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return null;
    const team = teams.find((t) => t.id === student.teamId);
    return {
      ...student,
      teamName: student.teamName || team?.name || "",
      teamAttribute: team?.attribute,
      teamLevel: team?.level,
    };
  }, [selectedStudentId, students, teams]);

  /** 比較層級基準下拉選項：依所選學員的球隊屬性切換（棒球 9 種 / 壘球 2 種） */
  const availableLevelBaselines = useMemo<readonly string[]>(() => {
    return getLevelOptionsByAttribute(selectedStudent?.teamAttribute);
  }, [selectedStudent?.teamAttribute]);

  /**
   * 學員切換時自動帶入該學員球隊的 level 為 levelBaseline 預設；
   * 若球隊沒設 level 或不在當前屬性的選項內，fallback 到屬性對應清單第一項
   */
  useEffect(() => {
    if (!selectedStudent) return;
    const teamLevel = selectedStudent.teamLevel;
    const inOptions = teamLevel && availableLevelBaselines.includes(teamLevel);
    if (inOptions) {
      setLevelBaseline(teamLevel);
    } else if (!availableLevelBaselines.includes(levelBaseline)) {
      setLevelBaseline(availableLevelBaselines[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?.teamId]);

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

  /** 各類型報告的預設勾選圖表 module id（順序即顯示順序） */
  const DEFAULT_MODULES: Record<string, string[]> = {
    // 打擊：個人成績分佈、攻擊角度/揮擊時間散佈、擊球落點＋強勁程度場地
    打擊: ["batting_3_6", "batting_3_5", "batting_3_4"],
    // 投球：個人成績分佈固定第一、球路位移圖第二
    投球: ["pitching_4_1", "pitching_4_2"],
  };

  const handleReportTypeChange = (value: string) => {
    setReportType(value as ReportType);
    const defaults = DEFAULT_MODULES[value] || [];
    setSelectedModules(defaults.map((moduleId, i) => ({ moduleId, order: i + 1 })));
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
      excludedSections: Array.from(excludedSections),
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
              {/* 投球報告不需要測驗方式（無實戰/發球機區分） */}
              {reportType !== "投球" && (
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
              )}
            </div>

            {/* ── 第三行：比較層級基準 / 比較模式（各 1/3） ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>比較層級基準</Label>
                <Select value={levelBaseline} onValueChange={(v) => setLevelBaseline(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableLevelBaselines.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {selectedStudent?.teamAttribute === "壘球"
                    ? "壘球層級（依學員球隊屬性帶入）"
                    : "棒球層級（依學員球隊屬性帶入）"}
                </p>
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
                    {reportType === "投球" ? ` · 對比${levelBaseline}` : ` · ${testMethod} · 對比${levelBaseline}`}
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
              <CardDescription>固定區塊已從資料庫載入，可關閉不需要的區塊；勾選圖表模組後可直接排序</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* 固定區塊 */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">固定區塊（由資料庫載入，預設全部顯示）</h4>
                <div className="space-y-1.5">
                  {fixedSections.map((section) => {
                    const isOn = !excludedSections.has(section.key);
                    return (
                      <div
                        key={section.key}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          isOn ? "bg-muted/40 border-border/50" : "bg-muted/20 border-border/30 opacity-60"
                        )}
                      >
                        <Switch
                          checked={isOn}
                          onCheckedChange={(checked) => {
                            setExcludedSections((prev) => {
                              const next = new Set(prev);
                              if (checked) next.delete(section.key);
                              else next.add(section.key);
                              return next;
                            });
                          }}
                          className="mt-0.5 flex-shrink-0"
                          aria-label={`${section.label} 顯示開關`}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">{section.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">{section.dataSource}</Badge>
                      </div>
                    );
                  })}
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
