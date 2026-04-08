import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";
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
import { battingMechanicsItems, pitchingMechanicsItems } from "@/components/reports/MechanicsChecklist";
import ChartModuleCard from "@/components/reports/ChartModuleCard";
import { getModuleById } from "@/data/reportModules";

/** 每頁最多放幾個圖表 */
const CHARTS_PER_PAGE = 2;

/** 將陣列分成固定大小的 chunk */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

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

  // Parse chart module config → resolved modules
  const chartModules = useMemo(() => {
    if (!report?.module_config) return [];
    const config = report.module_config as {
      modules?: Array<{ module_id: string; order: number }>;
    };
    return (config.modules || [])
      .sort((a, b) => a.order - b.order)
      .map((m) => getModuleById(m.module_id))
      .filter((m) => m != null);
  }, [report]);

  /** 從 chart_data 讀取報告設定（比較次數、層級、測驗方式、無數據區塊） */
  const reportConfig = useMemo(() => {
    const data = (report?.chart_data || {}) as {
      compare_count?: number;
      level_baseline?: string;
      test_method?: string;
      previous_dates?: string[];
      /** 無資料需要跳過的頁面 key 列表（如 ["fitness", "swing"]） */
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

  /** 判斷某區塊是否有數據（後端填入後此函式回傳 false 則跳過該頁） */
  const hasSection = (key: string) => !reportConfig.missingSections.has(key);

  /** 決定投球報告是否要顯示「每球種獨立分頁」(僅當 compareCount >= 1) */
  const showPitchPerTypePages = reportConfig.compareCount >= 1;

  // Split charts into pages of CHARTS_PER_PAGE
  const chartPages = useMemo(() => chunk(chartModules, CHARTS_PER_PAGE), [chartModules]);

  // Determine report type
  const reportType = report?.type === "投球" ? "投球" : "打擊";
  const isBatting = report?.type === "打擊";
  const isPitching = report?.type === "投球";

  // Mechanics items for explanation
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

  // ── Build ordered pages array so we can calculate total page count ──
  type PageContent = { key: string; render: () => React.ReactNode };
  const pages: PageContent[] = [];

  const { compareCount, levelBaseline, testMethod } = reportConfig;

  // P: 選手個資 + 身體素質（若無身體素質數據則跳過）
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

  // 投球限定：活動度 + 危險因子
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

  // 打擊：揮棒數據
  if (isBatting && hasSection("swing")) {
    pages.push({
      key: "swing",
      render: () => (
        <SwingDataSection previousCount={compareCount} testMethod={testMethod} levelLabel={levelBaseline} />
      ),
    });
  }

  // 打擊：擊球數據
  if (isBatting && hasSection("hitting")) {
    pages.push({
      key: "hitting",
      render: () => (
        <HittingDataSection previousCount={compareCount} testMethod={testMethod} levelLabel={levelBaseline} />
      ),
    });
  }

  // 投球：球種數據（單次檢測 — 全部球種同頁，沒有前次比較時顯示此頁）
  if (isPitching && compareCount === 0 && hasSection("pitch")) {
    pages.push({ key: "pitch-single", render: () => <PitchTypeSection previousCount={0} /> });
  }

  // 投球：球種數據（多次比較 — 每球種獨立一頁，僅 compareCount >= 1 時顯示）
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

  // 動作機制查核（若無機制數據則跳過）
  if (hasSection("mechanics")) {
    pages.push({
      key: "mechanics",
      render: () => <MechanicsChecklist type={isBatting ? "batting" : "pitching"} />,
    });

    // 機制說明
    // 根據會議決議：僅顯示被標示為問題的機制說明；個人化建議來自語音轉文字或教練手動輸入，
    // 若無上傳錄音也無手動輸入，則不顯示個人化建議區塊
    pages.push({
      key: "mechanics-explain",
      render: () => <MechanicsExplanation items={mechanicsItems} />,
    });
  }

  // 圖表頁面（每頁最多 CHARTS_PER_PAGE 張圖表）
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

  // 教練備註
  if (report.markdown_notes) {
    pages.push({
      key: "notes",
      render: () => (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            教練備註
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-4 border border-border/50">
            <ReactMarkdown>{report.markdown_notes}</ReactMarkdown>
          </div>
        </div>
      ),
    });
  }

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
        {/* 麵包屑 */}
        <div className="mb-6 print:hidden">
          <PageBreadcrumb
            items={[
              { label: "檢測報告", path: "/reports" },
              { label: report.title || `${playerInfo.name} - ${report.type}報告` },
            ]}
          />
        </div>
        {pages.map((page, idx) => (
          <A4PageContainer key={page.key} pageNumber={idx + 1} totalPages={totalPages}>
            {page.render()}
          </A4PageContainer>
        ))}
      </div>
    </AppLayout>
  );
};

export default ReportView;
