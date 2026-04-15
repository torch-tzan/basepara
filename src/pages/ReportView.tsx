import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { useReportById } from "@/hooks/useSupabaseReports";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import A4PageContainer from "@/components/reports/A4PageContainer";
import PlayerInfoHeader, { type PlayerInfo } from "@/components/reports/PlayerInfoHeader";
import FitnessSection from "@/components/reports/FitnessSection";
import SwingDataSection from "@/components/reports/SwingDataSection";
import HittingDataSection from "@/components/reports/HittingDataSection";
import PitchTypeSection, { allPitchTypes } from "@/components/reports/PitchTypeSection";
import MobilitySection from "@/components/reports/MobilitySection";
import MechanicsChecklist from "@/components/reports/MechanicsChecklist";
import MechanicsExplanation from "@/components/reports/MechanicsExplanation";
import VideoPlayer, { type VideoClip } from "@/components/reports/VideoPlayer";
import { battingMechanicsItems, pitchingMechanicsItems } from "@/components/reports/MechanicsChecklist";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { getModuleById } from "@/data/reportModules";

/** 每頁最多放幾個圖表（預設 2 張；出手點散佈圖太高，獨佔一頁） */
const CHARTS_PER_PAGE = 2;
/** 需獨佔一頁的圖表模組 ID */
const SOLO_PAGE_MODULE_IDS = new Set(["pitching_4_4"]);

/** 將陣列分成固定大小的 chunk */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/** 智慧分頁：指定 ID 的模組獨佔一頁，其餘每頁 `size` 張 */
function smartChunkModules<T extends { id: string }>(
  modules: T[],
  size: number,
  soloIds: Set<string>
): T[][] {
  const pages: T[][] = [];
  let cur: T[] = [];
  const flush = () => {
    if (cur.length > 0) {
      pages.push(cur);
      cur = [];
    }
  };
  for (const m of modules) {
    if (soloIds.has(m.id)) {
      flush();
      pages.push([m]);
      continue;
    }
    cur.push(m);
    if (cur.length >= size) flush();
  }
  flush();
  return pages;
}

/**
 * 依據報告日期產出當日影片清單（Mock）。
 * 實際上線後改由後端 / Supabase Storage 依 (student_id, date) 查詢。
 */
function getClipsByDate(date: string, type: "batting" | "pitching"): VideoClip[] {
  if (!date) return [];
  const label = type === "batting" ? "打擊" : "投球";
  return [
    { label: `${label} · 正面視角（${date}）`, src: "" },
    { label: `${label} · 側面視角（${date}）`, src: "" },
    { label: `${label} · 慢動作（${date}）`, src: "" },
  ];
}

/** 純檢視模式：不可新增或刪除圖表模組 */
const ReportView = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading } = useReportById(reportId);
  const { students } = useStudents();
  const { teams } = useTeams();

  // Build player info from student config
  const playerInfo = useMemo((): PlayerInfo | null => {
    if (!report) return null;
    const snapshot = report.student_snapshot as Record<string, string> | null;
    const student = students.find((s) => s.id === report.student_id);
    const team = student ? teams.find((t) => t.id === student.teamId) : null;

    const height = student?.height ? Number(student.height) : undefined;
    const weight = student?.weight ? Number(student.weight) : undefined;
    const birthday = student?.birthday;

    return {
      name: snapshot?.name || student?.name || "未知學員",
      team: snapshot?.team || team?.name || "",
      height: height && !isNaN(height) ? height : undefined,
      weight: weight && !isNaN(weight) ? weight : undefined,
      throwsRL: student?.throwingHand || "",
      batsRL: student?.battingHand || "",
      testDate: report.date,
      age: birthday
        ? Math.floor(
            (new Date(report.date).getTime() - new Date(birthday).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : undefined,
      level: undefined,
      position: student?.position,
    };
  }, [report, students, teams]);

  // Parse chart module config → module list (純檢視：不可變動)
  const chartModules = useMemo(() => {
    if (!report?.module_config) return [];
    const config = report.module_config as {
      modules?: Array<{ module_id: string; order: number }>;
    };
    return (config.modules || [])
      .sort((a, b) => a.order - b.order)
      .map((m) => getModuleById(m.module_id))
      .filter((m): m is NonNullable<ReturnType<typeof getModuleById>> => m != null);
  }, [report]);

  /** 從 chart_data 讀取報告設定 */
  const reportConfig = useMemo(() => {
    const data = (report?.chart_data || {}) as {
      compare_count?: number;
      level_baseline?: string;
      test_method?: string;
      previous_dates?: string[];
      missing_sections?: string[];
    };
    return {
      compareCount: typeof data.compare_count === "number" ? data.compare_count : 1,
      levelBaseline: data.level_baseline || "高中",
      testMethod: data.test_method || "實戰",
      previousDates: data.previous_dates || [],
      missingSections: new Set(data.missing_sections || []),
    };
  }, [report]);

  const hasSection = (key: string) => !reportConfig.missingSections.has(key);
  const showPitchPerTypePages = reportConfig.compareCount >= 1;
  const chartPages = useMemo(
    () => smartChunkModules(chartModules, CHARTS_PER_PAGE, SOLO_PAGE_MODULE_IDS),
    [chartModules]
  );

  const reportType = report?.type === "投球" ? "投球" : "打擊";
  const isBatting = report?.type === "打擊";
  const isPitching = report?.type === "投球";
  const mechanicsItems = isBatting ? battingMechanicsItems : pitchingMechanicsItems;

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <AppLayout title="檢測報告">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!report || !playerInfo) {
    return (
      <AppLayout title="檢測報告">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">找不到此報告</p>
          <Button variant="outline" onClick={() => navigate("/reports")}>
            返回列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  // 當日影片（依 report.date 載入）
  const videoClips = getClipsByDate(report.date, isBatting ? "batting" : "pitching");

  type PageContent = { key: string; render: () => React.ReactNode; printHidden?: boolean };
  const pages: PageContent[] = [];
  const { compareCount, levelBaseline, testMethod } = reportConfig;

  if (hasSection("fitness")) {
    pages.push({
      key: "player-fitness",
      render: () => (
        <>
          <PlayerInfoHeader player={{ ...playerInfo, level: levelBaseline }} reportType={reportType} />
          <FitnessSection previousCount={compareCount} levelLabel={levelBaseline} />
        </>
      ),
    });
  }

  if (isPitching && hasSection("mobility")) {
    pages.push({
      key: "mobility",
      render: () => (
        <>
          <PlayerInfoHeader player={{ ...playerInfo, level: levelBaseline }} reportType={reportType} />
          <MobilitySection previousCount={compareCount} />
        </>
      ),
    });
  }

  if (isBatting && hasSection("swing")) {
    pages.push({
      key: "swing",
      render: () => (
        <SwingDataSection previousCount={compareCount} testMethod={testMethod} levelLabel={levelBaseline} />
      ),
    });
  }

  if (isBatting && hasSection("hitting")) {
    pages.push({
      key: "hitting",
      render: () => (
        <HittingDataSection previousCount={compareCount} testMethod={testMethod} levelLabel={levelBaseline} />
      ),
    });
  }

  if (isPitching && compareCount === 0 && hasSection("pitch")) {
    pages.push({ key: "pitch-single", render: () => <PitchTypeSection previousCount={0} /> });
  }

  if (isPitching && showPitchPerTypePages && hasSection("pitch")) {
    allPitchTypes.forEach((pt) => {
      pages.push({
        key: `pitch-compare-${pt}`,
        render: () => (
          <PitchTypeSection previousCount={compareCount} singlePitchType={pt} />
        ),
      });
    });
  }

  if (hasSection("mechanics")) {
    pages.push({
      key: "mechanics",
      render: () => (
        <MechanicsChecklist type={isBatting ? "batting" : "pitching"} />
      ),
    });

    // 影片獨立一頁，且列印 / PDF 輸出時不顯示
    pages.push({
      key: "mechanics-video",
      printHidden: true,
      render: () => (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">檢測影片</h3>
          <VideoPlayer
            type={isBatting ? "batting" : "pitching"}
            clips={videoClips}
            date={report.date}
          />
        </div>
      ),
    });

    pages.push({
      key: "mechanics-explain",
      render: () => (
        <MechanicsExplanation
          items={mechanicsItems}
          personalAdvice={report.markdown_notes || undefined}
          readOnly
        />
      ),
    });
  }

  // 圖表頁面（純檢視）
  chartPages.forEach((pageModules, idx) => {
    pages.push({
      key: `charts-${idx}`,
      render: () => (
        <div className="space-y-6">
          <h3 className="text-base font-semibold text-foreground">
            圖表分析{chartPages.length > 1 ? ` (${idx + 1}/${chartPages.length})` : ""}
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {pageModules.map((mod) => (
              <ChartModuleCard key={mod.id} module={mod} />
            ))}
          </div>
        </div>
      ),
    });
  });

  const totalPages = pages.length;

  return (
    <AppLayout
      title="檢測報告"
      headerAction={
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            列印
          </Button>
          <Button variant="outline" onClick={handlePrint}>
            <Download className="w-4 h-4 mr-2" />
            匯出 PDF
          </Button>
        </div>
      }
    >
      <div className="pb-12 print:pb-0">
        <div className="mb-6 print:hidden">
          <PageBreadcrumb
            items={[
              { label: "檢測報告", path: "/reports" },
              { label: report.title || `${playerInfo.name} - ${report.type}報告` },
            ]}
          />
        </div>
        {pages.map((page, idx) => (
          <A4PageContainer
            key={page.key}
            pageNumber={idx + 1}
            totalPages={totalPages}
            className={page.printHidden ? "print:hidden" : undefined}
          >
            {page.render()}
          </A4PageContainer>
        ))}
      </div>
    </AppLayout>
  );
};

export default ReportView;
