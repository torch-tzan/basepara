import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import A4PageContainer from "@/components/reports/A4PageContainer";
import PlayerInfoHeader from "@/components/reports/PlayerInfoHeader";
import FitnessSection from "@/components/reports/FitnessSection";
import SwingDataSection from "@/components/reports/SwingDataSection";
import HittingDataSection from "@/components/reports/HittingDataSection";
import MobilitySection from "@/components/reports/MobilitySection";
import PitchTypeSection, { allPitchTypes } from "@/components/reports/PitchTypeSection";
import MechanicsChecklist, {
  battingMechanicsItems,
  pitchingMechanicsItems,
} from "@/components/reports/MechanicsChecklist";
import AdvancedMechanicsTable from "@/components/reports/AdvancedMechanicsTable";
import { isAICoachReport } from "@/data/advancedMechanicsCheckpoints";
import BattingDistributionChart from "@/components/reports/charts/BattingDistributionChart";
import MechanicsExplanation from "@/components/reports/MechanicsExplanation";
import VideoPlayer, { type VideoClip } from "@/components/reports/VideoPlayer";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { getModulesByReportType } from "@/data/reportModules";
import { supabase } from "@/integrations/supabase/client";
import { useStudents } from "@/contexts/StudentsContext";
import { REPORT_NEW_DRAFT_KEY, type ReportDraft } from "./ReportNew";

/** 依日期產出當日影片清單（Mock） */
function getClipsByDate(date: string, type: "batting" | "pitching"): VideoClip[] {
  if (!date) return [];
  const label = type === "batting" ? "打擊" : "投球";
  return [
    { label: `${label} · 正面視角（${date}）`, src: "" },
    { label: `${label} · 側面視角（${date}）`, src: "" },
    { label: `${label} · 慢動作（${date}）`, src: "" },
  ];
}

/**
 * 新增報告 — A4 預覽頁
 * 從 sessionStorage 讀取草稿，以 A4 內頁形式呈現，可即時編輯：
 * - 圖表模組增刪
 * - 教練回覆文字
 * 確認後寫入 Supabase 並跳轉到 ReportView。
 */
const ReportNewPreview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { authUser } = useAuth();
  const { students } = useStudents();

  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [personalAdvice, setPersonalAdvice] = useState("");
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── 從 sessionStorage 讀取草稿 ──
  useEffect(() => {
    const raw = sessionStorage.getItem(REPORT_NEW_DRAFT_KEY);
    if (!raw) {
      toast({
        title: "找不到報告草稿",
        description: "請重新填寫表單",
        variant: "destructive",
      });
      navigate("/reports/new");
      return;
    }
    try {
      const d = JSON.parse(raw) as ReportDraft;
      setDraft(d);
      setPersonalAdvice(d.personalAdvice || "");
      setSelectedModuleIds(d.selectedModules.map((m) => m.moduleId));
    } catch {
      navigate("/reports/new");
    }
  }, [navigate, toast]);

  // 可用模組（依報告類型）
  const availableModules = useMemo(() => {
    if (!draft) return [];
    return getModulesByReportType(draft.reportType as "打擊" | "投球");
  }, [draft]);

  // 已加入的模組（保持選取順序）
  const selectedModules = useMemo(() => {
    return selectedModuleIds
      .map((id) => availableModules.find((m) => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m != null);
  }, [selectedModuleIds, availableModules]);

  const notAddedModules = useMemo(
    () => availableModules.filter((m) => !selectedModuleIds.includes(m.id)),
    [availableModules, selectedModuleIds]
  );

  const handleAddModule = (id: string) => {
    if (!selectedModuleIds.includes(id)) {
      setSelectedModuleIds((prev) => [...prev, id]);
    }
  };

  const handleRemoveModule = (id: string) => {
    setSelectedModuleIds((prev) => prev.filter((m) => m !== id));
  };

  // 儲存到 Supabase，跳轉到 ReportView
  const handleConfirmSave = async () => {
    if (!draft) return;
    setIsSubmitting(true);

    const id = crypto.randomUUID();
    const moduleConfig = {
      modules: selectedModuleIds.map((moduleId, i) => {
        const mod = availableModules.find((m) => m.id === moduleId);
        return { module_id: moduleId, module_name: mod?.name || moduleId, order: i + 1 };
      }),
    };
    const chartData = {
      test_date: draft.testDate,
      compare_count: draft.compareCount,
      previous_dates: draft.previousDates,
      level_baseline: draft.levelBaseline,
      test_method: draft.testMethod,
      missing_sections: draft.excludedSections ?? [],
    };

    try {
      const { error } = await supabase.from("reports").insert({
        id,
        date: draft.testDate.replace(/\//g, "-"),
        student_id: draft.selectedStudentId,
        type: draft.reportType,
        title: draft.autoTitle,
        module_config: moduleConfig as unknown as Record<string, unknown>,
        markdown_notes: personalAdvice.trim() || null,
        student_snapshot: {
          name: draft.studentName,
          team: draft.studentTeamName,
        } as unknown as Record<string, unknown>,
        chart_data: chartData as unknown as Record<string, unknown>,
        coach_id: authUser?.id || null,
      });
      if (error) throw error;
      sessionStorage.removeItem(REPORT_NEW_DRAFT_KEY);
      toast({ title: "報告已建立", description: draft.autoTitle });
      navigate(`/reports/${id}`);
    } catch (err) {
      toast({
        title: "建立失敗",
        description: err instanceof Error ? err.message : "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 尚未載入
  if (!draft) {
    return (
      <AppLayout title="報告預覽">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const isBatting = draft.reportType === "打擊";
  const isPitching = draft.reportType === "投球";
  const mechItems = isBatting ? battingMechanicsItems : pitchingMechanicsItems;
  const videoClips = getClipsByDate(draft.testDate, isBatting ? "batting" : "pitching");

  // 從 students 補充其他資訊（身高、體重、打擊手、投手等）
  const student = students.find((s) => s.id === draft.selectedStudentId);
  const playerInfo = {
    name: draft.studentName,
    team: draft.studentTeamName,
    height: student?.height ? Number(student.height) : undefined,
    weight: student?.weight ? Number(student.weight) : undefined,
    throwsRL: student?.throwingHand || "",
    batsRL: student?.battingHand || "",
    testDate: draft.testDate,
    level: draft.levelBaseline,
    position: student?.position,
  };

  // ── 建構 A4 頁面 ──
  type Page = { key: string; content: React.ReactNode; printHidden?: boolean };
  const pages: Page[] = [];

  // ── 跳過邏輯：與 ReportView 的 hasSection() 一致，依 draft.excludedSections 跳過固定區塊 ──
  const excludedSet = new Set(draft.excludedSections ?? []);
  const hasSection = (key: string) => !excludedSet.has(key);

  // 1. 選手個資 + 身體素質
  if (hasSection("fitness")) {
    pages.push({
      key: "fitness",
      content: (
        <>
          <PlayerInfoHeader player={playerInfo} reportType={draft.reportType} />
          <FitnessSection previousCount={draft.compareCount} levelLabel={draft.levelBaseline} showPR={true} studentId={draft.selectedStudentId} />
        </>
      ),
    });
  }

  // 2. 投球：活動度 + 危險因子
  if (isPitching && hasSection("mobility")) {
    pages.push({
      key: "mobility",
      content: (
        <>
          <PlayerInfoHeader player={playerInfo} reportType={draft.reportType} />
          <MobilitySection previousCount={draft.compareCount} />
        </>
      ),
    });
  }

  // 3. 打擊：揮棒 + 擊球（每頁底部加 2 個分布圖以對應 pptx 規格）
  if (isBatting && hasSection("swing")) {
    pages.push({
      key: "swing",
      content: (
        <div className="flex flex-col h-full">
          <SwingDataSection
            previousCount={draft.compareCount}
            testMethod={draft.testMethod}
            levelLabel={draft.levelBaseline}
            showPR={true}
            studentId={draft.selectedStudentId}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BattingDistributionChart defaultMetric="swing_speed" lockMetric compact />
            <BattingDistributionChart defaultMetric="swing_time" lockMetric compact />
          </div>
        </div>
      ),
    });
  }
  if (isBatting && hasSection("hitting")) {
    pages.push({
      key: "hitting",
      content: (
        <div className="flex flex-col h-full">
          <HittingDataSection
            previousCount={draft.compareCount}
            testMethod={draft.testMethod}
            levelLabel={draft.levelBaseline}
            showPR={true}
            studentId={draft.selectedStudentId}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <BattingDistributionChart defaultMetric="exit_velo" lockMetric compact />
            <BattingDistributionChart defaultMetric="launch_angle" lockMetric compact />
          </div>
        </div>
      ),
    });
  }

  // 4. 投球：球種
  if (isPitching && draft.compareCount === 0 && hasSection("pitch")) {
    pages.push({
      key: "pitch-single",
      content: (
        <PitchTypeSection
          previousCount={0}
          studentId={draft.selectedStudentId}
          levelLabel={draft.levelBaseline as "國中" | "高中" | "大學" | "職業"}
        />
      ),
    });
  }
  if (isPitching && draft.compareCount >= 1 && hasSection("pitch")) {
    allPitchTypes.forEach((pt) => {
      pages.push({
        key: `pitch-${pt}`,
        content: (
          <PitchTypeSection
            previousCount={draft.compareCount}
            singlePitchType={pt}
            studentId={draft.selectedStudentId}
            levelLabel={draft.levelBaseline as "國中" | "高中" | "大學" | "職業"}
          />
        ),
      });
    });
  }

  // 5. 機制查核
  // - 使用 AI Coach 動態捕捉 → 顯示進階查核點表格（單頁，項目少）
  // - 否則 → 顯示一般查核清單（投球 26 項會破版，切成 19 + 7 兩段）
  const useAICoach = isAICoachReport(draft.testDate);
  const MECHANICS_PAGE_LIMIT = 19;
  const mechanicsAllItems = isBatting ? battingMechanicsItems : pitchingMechanicsItems;
  const mechanicsPage1 = mechanicsAllItems.slice(0, MECHANICS_PAGE_LIMIT);
  const mechanicsPage2 = useAICoach ? [] : mechanicsAllItems.slice(MECHANICS_PAGE_LIMIT);

  if (hasSection("mechanics")) {
    pages.push({
      key: "mechanics",
      content: useAICoach ? (
        <AdvancedMechanicsTable type={isBatting ? "batting" : "pitching"} />
      ) : (
        <MechanicsChecklist
          type={isBatting ? "batting" : "pitching"}
          items={mechanicsPage1}
        />
      ),
    });

    // 5b. 影片（列印時不顯示）— 投球超過 19 項時，溢位的項目與影片同頁
    pages.push({
      key: "mechanics-video",
      // 有溢位清單 → 整頁要印；沒有 → 保持 printHidden
      printHidden: mechanicsPage2.length === 0,
      content: (
        <div className="space-y-6">
          {mechanicsPage2.length > 0 && (
            <MechanicsChecklist
              type={isBatting ? "batting" : "pitching"}
              items={mechanicsPage2}
              title={`${isBatting ? "打擊" : "投球"}動作機制查核（續）`}
            />
          )}
          <div className="space-y-4 print:hidden">
            <h3 className="text-base font-semibold text-foreground">檢測影片</h3>
            <VideoPlayer
              type={isBatting ? "batting" : "pitching"}
              clips={videoClips}
              date={draft.testDate}
            />
          </div>
        </div>
      ),
    });
  }

  // 6. 機制說明 + 教練回覆（可編輯）— 僅完整版（人為上傳）顯示；
  //    AI Coach 簡易版只標記「好/差」，不需要罐頭文字說明
  if (hasSection("mechanics") && !useAICoach) {
    pages.push({
      key: "mechanics-explain",
      content: (
        <div className="space-y-4">
          <MechanicsExplanation
            items={mechItems}
            personalAdvice={personalAdvice || undefined}
            onPersonalAdviceChange={setPersonalAdvice}
          />
        </div>
      ),
    });
  } else if (hasSection("mechanics") && personalAdvice) {
    // AI Coach 模式仍可保留教練回覆區塊（如果有寫的話）— 顯示 readOnly 即可
    pages.push({
      key: "coach-advice",
      content: (
        <div className="space-y-4">
          <MechanicsExplanation
            items={[]}
            personalAdvice={personalAdvice}
            onPersonalAdviceChange={setPersonalAdvice}
          />
        </div>
      ),
    });
  }

  // 7. 圖表頁（預設每頁 2 張；出手點散佈圖 pitching_4_4 獨佔一頁）
  const SOLO_IDS = new Set(["pitching_4_4"]);
  const chartChunks: typeof selectedModules[] = [];
  {
    let cur: typeof selectedModules = [];
    const flush = () => { if (cur.length > 0) { chartChunks.push(cur); cur = []; } };
    for (const m of selectedModules) {
      if (SOLO_IDS.has(m.id)) {
        flush();
        chartChunks.push([m]);
        continue;
      }
      cur.push(m);
      if (cur.length >= 2) flush();
    }
    flush();
  }

  if (chartChunks.length === 0) {
    pages.push({
      key: "charts-empty",
      content: (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">圖表分析</h3>
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-3">尚未加入任何圖表</p>
            {notAddedModules.length > 0 && (
              <Select onValueChange={handleAddModule}>
                <SelectTrigger className="w-56 h-9 text-sm">
                  <SelectValue placeholder="+ 新增圖表" />
                </SelectTrigger>
                <SelectContent>
                  {notAddedModules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      ),
    });
  } else {
    chartChunks.forEach((chunkArr, idx) => {
      const isLast = idx === chartChunks.length - 1;
      pages.push({
        key: `charts-${idx}`,
        content: (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">
                圖表分析{chartChunks.length > 1 ? ` (${idx + 1}/${chartChunks.length})` : ""}
              </h3>
              {isLast && notAddedModules.length > 0 && (
                <Select onValueChange={handleAddModule}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="+ 新增圖表" />
                  </SelectTrigger>
                  <SelectContent>
                    {notAddedModules.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {chunkArr.map((mod) => (
                <div key={mod.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background border border-border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={() => handleRemoveModule(mod.id)}
                    title="從報告中移除此圖表"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <ChartModuleCard module={mod} />
                </div>
              ))}
            </div>
          </div>
        ),
      });
    });
  }

  const totalPages = pages.length;

  return (
    <AppLayout
      title="報告預覽"
      headerAction={
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => navigate("/reports/new")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回編輯
          </Button>
          <Button onClick={handleConfirmSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            確認產生並儲存
          </Button>
        </div>
      }
    >
      <div className="pb-12 print:pb-0">
        {/* 麵包屑 + 資訊摘要 */}
        <div className="mb-6 print:hidden space-y-2">
          <PageBreadcrumb
            items={[
              { label: "檢測報告", path: "/reports" },
              { label: "新增報告", path: "/reports/new" },
              { label: "預覽" },
            ]}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-foreground">{draft.autoTitle}</span>
            <Badge variant="outline">{draft.testMethod}</Badge>
            <Badge variant="outline">對比{draft.levelBaseline}</Badge>
            {draft.previousDates.length > 0 && (
              <span className="text-muted-foreground">
                比較：{draft.previousDates.join("、")}
              </span>
            )}
            <span className="text-muted-foreground ml-auto">
              共 {totalPages} 頁 · hover 圖表右上角可移除、最後一頁可新增
            </span>
          </div>
        </div>

        {pages.map((page, idx) => (
          <A4PageContainer
            key={page.key}
            pageNumber={idx + 1}
            totalPages={totalPages}
            className={page.printHidden ? "print:hidden" : undefined}
          >
            {page.content}
          </A4PageContainer>
        ))}
      </div>
    </AppLayout>
  );
};

export default ReportNewPreview;
