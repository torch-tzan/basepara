import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Download,
  Printer,
  BarChart3,
  FileText,
  Calendar,
  User,
  Users,
} from "lucide-react";
import { useReportById } from "@/hooks/useSupabaseReports";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { getModuleById } from "@/data/reportModules";
import ChartModuleCard from "@/components/reports/ChartModuleCard";

const ReportView = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { data: report, isLoading } = useReportById(reportId);
  const { students } = useStudents();
  const { teams } = useTeams();

  // Get student & team info
  const studentInfo = useMemo(() => {
    if (!report) return null;

    const snapshot = report.student_snapshot as Record<string, string> | null;
    const student = students.find((s) => s.id === report.student_id);
    const team = student ? teams.find((t) => t.id === student.teamId) : null;

    return {
      name: snapshot?.name || student?.name || "未知學員",
      teamName: snapshot?.team || team?.name || "",
      battingHand: snapshot?.batting_hand || "",
      throwingHand: snapshot?.throwing_hand || "",
    };
  }, [report, students, teams]);

  // Parse module config
  const moduleConfig = useMemo(() => {
    if (!report?.module_config) return [];
    const config = report.module_config as {
      modules?: Array<{ module_id: string; module_name: string; order: number }>;
    };
    return (config.modules || []).sort((a, b) => a.order - b.order);
  }, [report]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <AppLayout title="檢測報告">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout title="檢測報告">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p className="text-muted-foreground">找不到此報告</p>
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="檢測報告"
      headerAction={
        <div className="flex items-center gap-3 print:hidden">
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Button>
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
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Report Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {report.title ||
                    `${studentInfo?.name} - ${report.type}報告`}
                </CardTitle>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.date}
                  </span>
                  <Badge variant="outline">{report.type}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  學員
                </span>
                <p className="font-medium">{studentInfo?.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  學校
                </span>
                <p className="font-medium">{studentInfo?.teamName || "—"}</p>
              </div>
              {studentInfo?.battingHand && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">打擊習慣</span>
                  <p className="font-medium">{studentInfo.battingHand}</p>
                </div>
              )}
              {studentInfo?.throwingHand && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">投球習慣</span>
                  <p className="font-medium">{studentInfo.throwingHand}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart Modules */}
        {moduleConfig.length > 0 ? (
          moduleConfig.map((mod) => {
            const moduleDef = getModuleById(mod.module_id);
            if (!moduleDef) {
              return (
                <Card key={mod.module_id}>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">{mod.module_name || mod.module_id}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return (
              <ChartModuleCard
                key={mod.module_id}
                module={moduleDef}
              />
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>此報告尚無圖表模組資料</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Markdown Notes */}
        {report.markdown_notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                教練備註
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{report.markdown_notes}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default ReportView;
