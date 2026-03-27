import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
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
  ArrowLeft,
  GripVertical,
  FileText,
  BarChart3,
  Eye,
  Save,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { getModulesByReportType, type ReportModule } from "@/data/reportModules";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { Database } from "@/integrations/supabase/types";

type ReportType = Database["public"]["Enums"]["report_type"];

// 模組選取狀態
interface SelectedModule {
  moduleId: string;
  order: number;
  expanded: boolean;
}

const ReportNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const { permissions } = usePermissions();
  const { filteredStudents, accessibleStudentIds } = useDataAccess("reports");
  const { students } = useStudents();
  const { teams } = useTeams();

  // Step 1: Report type & student
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reportTitle, setReportTitle] = useState("");

  // Step 2: Module selection
  const [selectedModules, setSelectedModules] = useState<SelectedModule[]>([]);

  // Step 4: Notes
  const [markdownNotes, setMarkdownNotes] = useState("");

  // UI state
  const [showPreview, setShowPreview] = useState(false);

  // Get available modules based on report type
  const availableModules = useMemo(() => {
    if (!reportType) return [];
    return getModulesByReportType(reportType);
  }, [reportType]);

  // Get searchable students for dropdown
  const searchableStudents = useMemo(() => {
    return filteredStudents.map((s) => {
      const team = teams.find((t) => t.id === s.team_id);
      return {
        id: s.id,
        name: s.name,
        teamKey: team?.id || "",
        teamName: team?.name || "",
      };
    });
  }, [filteredStudents, teams]);

  // Get selected student info
  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) return null;
    const team = teams.find((t) => t.id === student.team_id);
    return {
      ...student,
      teamName: team?.name || "",
    };
  }, [selectedStudentId, students, teams]);

  // Handle module toggle
  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (checked) {
      setSelectedModules((prev) => [
        ...prev,
        {
          moduleId,
          order: prev.length + 1,
          expanded: false,
        },
      ]);
    } else {
      setSelectedModules((prev) =>
        prev
          .filter((m) => m.moduleId !== moduleId)
          .map((m, i) => ({ ...m, order: i + 1 }))
      );
    }
  };

  // Handle module expand toggle
  const handleModuleExpand = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.map((m) =>
        m.moduleId === moduleId ? { ...m, expanded: !m.expanded } : m
      )
    );
  };

  // Move module up/down (drag-and-drop placeholder)
  const handleMoveModule = (moduleId: string, direction: "up" | "down") => {
    setSelectedModules((prev) => {
      const idx = prev.findIndex((m) => m.moduleId === moduleId);
      if (idx === -1) return prev;
      if (direction === "up" && idx === 0) return prev;
      if (direction === "down" && idx === prev.length - 1) return prev;

      const newModules = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newModules[idx], newModules[swapIdx]] = [newModules[swapIdx], newModules[idx]];
      return newModules.map((m, i) => ({ ...m, order: i + 1 }));
    });
  };

  // Check if form is ready
  const isStep1Complete = !!reportType && !!selectedStudentId;
  const isStep2Complete = selectedModules.length > 0;
  const canGenerate = isStep1Complete && isStep2Complete;

  // Handle generate report (placeholder)
  const handleGenerateReport = () => {
    toast({
      title: "報告產生功能開發中",
      description: "報告建立流程框架已就緒，後續將接入圖表模組與資料庫。",
    });
  };

  // Reset modules when report type changes
  const handleReportTypeChange = (value: string) => {
    setReportType(value as ReportType);
    setSelectedModules([]);
  };

  return (
    <AppLayout
      title="新增檢測報告"
      headerAction={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      }
    >
      <div className="h-[calc(100vh-72px)] -m-8">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={showPreview && isStep2Complete ? 50 : 100}>
            <div className="overflow-y-auto h-full p-8 space-y-6">
          {/* Step 1: Report Type & Student */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <CardTitle className="text-lg">選擇報告類型與學員</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>報告類型 <span className="text-destructive">*</span></Label>
                  <Select value={reportType} onValueChange={handleReportTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇報告類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="打擊">打擊報告</SelectItem>
                      <SelectItem value="投球">投球報告</SelectItem>
                      <SelectItem value="體測">體測報告</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>選擇學員 <span className="text-destructive">*</span></Label>
                  <StudentSearchSelect
                    students={searchableStudents}
                    value={selectedStudentId}
                    onChange={setSelectedStudentId}
                    placeholder="搜尋學員..."
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>報告標題（選填）</Label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={
                    selectedStudent && reportType
                      ? `${selectedStudent.name} - ${reportType}報告 - ${new Date().toLocaleDateString("zh-TW")}`
                      : "自動產生或手動輸入"
                  }
                />
              </div>
              {selectedStudent && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <span>
                    學員：<strong>{selectedStudent.name}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    學校：{selectedStudent.teamName}
                  </span>
                  <span className="text-muted-foreground">
                    教練：{authUser?.name}
                  </span>
                  <span className="text-muted-foreground">
                    日期：{new Date().toLocaleDateString("zh-TW")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Module Selection — 需先完成步驟 1 才顯示 */}
          {isStep1Complete ? (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    2
                  </div>
                  <CardTitle className="text-lg">勾選圖表模組</CardTitle>
                </div>
                <CardDescription>
                  選擇要包含在報告中的圖表模組，可勾選多個
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableModules.map((mod) => {
                    const isSelected = selectedModules.some(
                      (m) => m.moduleId === mod.id
                    );
                    return (
                      <div
                        key={mod.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-primary/50 bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          id={mod.id}
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleModuleToggle(mod.id, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={mod.id}
                            className="text-sm font-medium cursor-pointer flex items-center gap-2"
                          >
                            {mod.name}
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {mod.specRef}
                            </Badge>
                            {mod.status === "pending_data" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                                待數據
                              </Badge>
                            )}
                          </label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="opacity-50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm font-bold">
                    2
                  </div>
                  <CardTitle className="text-lg">勾選圖表模組</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">請先選擇報告類型與學員</p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Module Order */}
          <Card
            className={
              !isStep2Complete ? "opacity-50 pointer-events-none" : ""
            }
          >
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                    isStep2Complete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  3
                </div>
                <CardTitle className="text-lg">排序模組</CardTitle>
              </div>
              <CardDescription>
                拖曳或使用箭頭調整圖表模組的顯示順序
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedModules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  請先勾選至少一個圖表模組
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedModules.map((sel, idx) => {
                    const mod = availableModules.find(
                      (m) => m.id === sel.moduleId
                    );
                    if (!mod) return null;
                    return (
                      <div
                        key={sel.moduleId}
                        className="flex items-center gap-2 p-3 rounded-lg border bg-card"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab flex-shrink-0" />
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{mod.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMoveModule(sel.moduleId, "up")}
                            disabled={idx === 0}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              handleMoveModule(sel.moduleId, "down")
                            }
                            disabled={idx === selectedModules.length - 1}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Notes */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  4
                </div>
                <CardTitle className="text-lg">文字備註</CardTitle>
              </div>
              <CardDescription>
                輸入報告的文字說明、分析、建議（支援 Markdown 格式）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Textarea
                    value={markdownNotes}
                    onChange={(e) => setMarkdownNotes(e.target.value)}
                    placeholder="在此輸入備註內容...&#10;&#10;支援 Markdown 格式：&#10;# 標題&#10;- 列表項目&#10;**粗體文字**"
                    className="min-h-[160px] font-mono text-sm resize-none field-sizing-content"
                  />
                </div>
                <div className="min-h-[160px] p-3 rounded-md border bg-muted/30 overflow-auto">
                  {markdownNotes ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{markdownNotes}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Markdown 預覽</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="w-3 h-3" />
                <span>後續將支援上傳錄音檔，由 AI 自動轉為文字</span>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="flex items-center justify-between pb-8">
            <Button variant="outline" onClick={() => navigate("/reports")}>
              取消
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                disabled={!isStep2Complete}
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview && isStep2Complete ? "隱藏預覽" : "顯示預覽"}
              </Button>
              <Button onClick={handleGenerateReport} disabled={!canGenerate}>
                <Save className="w-4 h-4 mr-2" />
                產生報告
              </Button>
            </div>
          </div>
            </div>
          </ResizablePanel>

          {/* Right: Preview Panel — 僅在有模組被選取時才顯示 */}
          {showPreview && isStep2Complete && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={17} maxSize={50}>
                <div className="bg-muted/30 overflow-y-auto h-full p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              報告預覽
            </h3>
            <Separator />

            {/* Preview Header */}
            {selectedStudent && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">學員</span>
                  <span className="font-medium">{selectedStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">學校</span>
                  <span>{selectedStudent.teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">報告類型</span>
                  <Badge variant="outline">{reportType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">生成教練</span>
                  <span>{authUser?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">日期</span>
                  <span>{new Date().toLocaleDateString("zh-TW")}</span>
                </div>
                {reportTitle && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">標題</span>
                    <span className="font-medium">{reportTitle}</span>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Preview Modules */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">圖表模組</h4>
              {selectedModules.map((sel) => {
                const mod = availableModules.find(
                  (m) => m.id === sel.moduleId
                );
                if (!mod) return null;
                return (
                  <ChartModuleCard
                    key={sel.moduleId}
                    module={mod}
                  />
                );
              })}
            </div>

            {/* Preview Notes */}
            {markdownNotes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">文字備註</h4>
                  <div className="p-3 rounded-lg border bg-card prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{markdownNotes}</ReactMarkdown>
                  </div>
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
