/**
 * 批次產出報告
 *  - 同一天 + 同一種報告類型（投球/打擊），一次選取多位選手
 *  - 預設帶入該類型所有圖表模組
 *  - 不需要預覽，直接產出 → 顯示進度條頁面
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudents } from "@/contexts/StudentsContext";
import { useToast } from "@/hooks/use-toast";
import { getModulesByReportType } from "@/data/reportModules";
import {
  CalendarIcon,
  ChevronLeft,
  Users,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType = "打擊" | "投球";
type JobStatus = "pending" | "processing" | "done" | "error";
interface BatchJob {
  studentId: string;
  studentName: string;
  status: JobStatus;
  progress: number; // 0-100
}

const ReportBatch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { students } = useStudents();

  // 設定階段
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportType, setReportType] = useState<ReportType>("打擊");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 產出階段
  const [running, setRunning] = useState(false);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const allModules = useMemo(() => getModulesByReportType(reportType), [reportType]);

  // Mock：假設所有學員當日都有資料（實際應查 Supabase）
  const availableStudents = students;

  const allSelected =
    availableStudents.length > 0 && selectedIds.length === availableStudents.length;

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : availableStudents.map((s) => s.id));
  };
  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canStart = selectedIds.length > 0 && !running;

  const startBatch = () => {
    if (!canStart) return;
    const newJobs: BatchJob[] = selectedIds.map((id) => ({
      studentId: id,
      studentName: students.find((s) => s.id === id)?.name ?? id,
      status: "pending",
      progress: 0,
    }));
    setJobs(newJobs);
    setCurrentIdx(0);
    setRunning(true);
  };

  // 模擬逐一產出（同時僅 1 個 in-progress，完成後推進下一個）
  useEffect(() => {
    if (!running) return;
    if (currentIdx >= jobs.length) {
      setRunning(false);
      toast({
        variant: "success",
        title: "✓ 批次產出完成",
        description: `已成功產出 ${jobs.length} 份${reportType}報告`,
      });
      return;
    }

    // 標記為 processing
    setJobs((prev) =>
      prev.map((j, i) => (i === currentIdx ? { ...j, status: "processing" } : j))
    );

    const id = setInterval(() => {
      setJobs((prev) => {
        const next = [...prev];
        const cur = next[currentIdx];
        if (!cur) return prev;
        const step = Math.random() * 20 + 8;
        const nextProg = Math.min(cur.progress + step, 100);
        next[currentIdx] = { ...cur, progress: nextProg };
        if (nextProg >= 100) {
          next[currentIdx] = { ...cur, progress: 100, status: "done" };
          clearInterval(id);
          // 推進到下一位
          setTimeout(() => setCurrentIdx((i) => i + 1), 200);
        }
        return next;
      });
    }, 180);

    return () => clearInterval(id);
  }, [running, currentIdx, jobs.length, reportType, toast]);

  const doneCount = jobs.filter((j) => j.status === "done").length;
  const overallProgress =
    jobs.length === 0
      ? 0
      : Math.round(jobs.reduce((s, j) => s + j.progress, 0) / jobs.length);

  // ═══ 進度頁面 ═══
  if (jobs.length > 0) {
    const allDone = doneCount === jobs.length && !running;
    return (
      <AppLayout title="批次產出報告 · 進度">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {allDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                  {allDone ? "產出完成" : "正在產出..."}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {format(new Date(date), "yyyy/MM/dd", { locale: zhTW })} · {reportType}報告
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span>整體進度 · {doneCount} / {jobs.length} 份完成</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {jobs.map((j) => (
                  <div
                    key={j.studentId}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md border",
                      j.status === "done"
                        ? "border-green-500/30 bg-green-500/5"
                        : j.status === "processing"
                        ? "border-primary/40 bg-primary/5"
                        : j.status === "error"
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-border"
                    )}
                  >
                    <div className="w-8 flex-shrink-0">
                      {j.status === "done" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : j.status === "processing" ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : j.status === "error" ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{j.studentName}</div>
                      <div className="mt-1">
                        <Progress value={j.progress} className="h-1" />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground w-14 text-right tabular-nums">
                      {j.status === "done" ? "完成" : j.status === "pending" ? "等待中" : `${Math.round(j.progress)}%`}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {allDone ? (
                  <>
                    <Button variant="outline" onClick={() => { setJobs([]); setSelectedIds([]); }}>
                      再次批次產出
                    </Button>
                    <Button onClick={() => navigate("/reports")}>
                      回到報告列表
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" disabled>
                    產出中，請勿離開
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // ═══ 設定頁面 ═══
  return (
    <AppLayout title="批次產出報告">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/reports")} className="gap-1">
          <ChevronLeft className="w-4 h-4" />
          回到報告列表
        </Button>

        {/* Step 1: 設定條件 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              條件設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 日期 */}
              <div className="space-y-2">
                <Label htmlFor="batch-date" className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  檢測 / 訓練日期
                </Label>
                <Input
                  id="batch-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {/* 報告類型 */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">報告類型</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["打擊", "投球"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReportType(t)}
                      className={cn(
                        "h-10 rounded-md border text-sm transition-all",
                        reportType === t
                          ? "bg-primary/10 border-primary text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent/40"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 模組預覽 */}
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
              <div className="font-medium text-foreground/80 mb-1.5">
                預設帶入圖表（共 {allModules.length} 項）
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allModules.map((m) => (
                  <Badge key={m.id} variant="outline" className="text-[10px] font-normal">
                    {m.specRef} · {m.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: 選學員 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                選擇學員
                <Badge variant="secondary" className="text-[10px] font-normal ml-1">
                  已選 {selectedIds.length} / {availableStudents.length}
                </Badge>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={toggleAll}>
                {allSelected ? "全部取消" : "全選"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {availableStudents.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                尚無可用學員
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {availableStudents.map((s) => {
                  const checked = selectedIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer transition-colors",
                        checked ? "border-primary/50 bg-primary/5" : "border-border hover:bg-accent/40"
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOne(s.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {s.teamName || "未分球隊"} · {s.position || "—"}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/reports")}>
            取消
          </Button>
          <Button onClick={startBatch} disabled={!canStart} className="gap-1.5">
            <PlayCircle className="w-4 h-4" />
            開始批次產出（{selectedIds.length}）
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportBatch;
