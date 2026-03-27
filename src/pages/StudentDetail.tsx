import { useParams, useNavigate } from "react-router-dom";
import { Edit, Calendar, FileText, Pencil } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileStudentProfile from "@/components/students/MobileStudentProfile";
import CoachDataError, { CoachSection } from "@/components/students/CoachDataError";
import StudentProfileSkeleton from "@/components/students/StudentProfileSkeleton";
import { toast } from "@/hooks/use-toast";
import { useStudentTeamHistory } from "@/hooks/useStudentTeamHistory";
import { calculateAge } from "@/lib/utils";

const StudentDetail = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { getStudentById, isLoading } = useStudents();
  const { getTeamById, getCoachesByTeam } = useTeams();
  const { accounts } = useAccounts();
  const { permissions } = usePermissions();
  const { authUser } = useAuth();
  const isMobile = useIsMobile();
  const canEdit = permissions.students.canEdit;
  const isStudent = authUser?.role === "student";

  const student = studentId ? getStudentById(studentId) : undefined;
  const teamAttribute = student ? getTeamById(student.teamId)?.attribute : undefined;

  // Team history
  const { data: teamHistoryData } = useStudentTeamHistory(studentId);
  const allTeamHistories = teamHistoryData || [];

  const getTeamName = (tid: string) => getTeamById(tid)?.name || tid;
  const getTeamCoachesForTeam = (tid: string) => getCoachesByTeam(tid).map((c) => c.name);
  const getCoachNames = (ids: string[]) =>
    ids.map((id) => accounts.find((a) => a.id === id)?.name).filter(Boolean) as string[];

  if (isLoading && !student) {
    return (
      <AppLayout title={isStudent ? "個人資料" : "學員資料"}>
        <div className="space-y-6">
          {!isStudent && !isMobile && (
            <PageBreadcrumb
              items={[
                { label: "學員管理", path: "/students" },
                { label: "載入中..." },
              ]}
            />
          )}
          <StudentProfileSkeleton isMobile={isMobile} />
        </div>
      </AppLayout>
    );
  }

  if (!student) {
    return (
      <AppLayout title="學員資料">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">找不到該學員</p>
          <Button variant="outline" onClick={() => navigate("/students")}>
            返回學員列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isStudent ? "個人資料" : student.name}
      headerAction={
        !isMobile ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (!permissions.schedule.canView) {
                  toast({
                    variant: "destructive",
                    title: "權限不足",
                    description: "您的角色沒有「課表管理」的檢視權限",
                  });
                  return;
                }
                navigate(`/schedule?student=${studentId}`);
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              查看課表
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (!permissions.reports.canView) {
                  toast({
                    variant: "destructive",
                    title: "權限不足",
                    description: "您的角色沒有「檢測報告」的檢視權限",
                  });
                  return;
                }
                navigate(`/reports?student=${studentId}`);
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              查看報告
            </Button>
            {canEdit && (
              <Button onClick={() => navigate(`/students/${studentId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                編輯
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {/* Mobile View */}
      {isMobile ? (
        <MobileStudentProfile student={student} allTeamHistories={allTeamHistories} />
      ) : (
      <div className="space-y-6">
        {!isStudent && (
        <PageBreadcrumb
          items={[
            { label: "學員管理", path: "/students" },
            { label: student.name },
          ]}
        />
        )}

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">姓名</p>
                  <p className="text-base font-medium">{student.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">投/野</p>
                  <p className="text-base font-medium">{student.playerType || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">位置</p>
                  <p className="text-base font-medium">{student.position || "-"}</p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">身高</p>
                  <p className="text-base font-medium">{student.height ? `${student.height} cm` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">體重</p>
                  <p className="text-base font-medium">{student.weight ? `${student.weight} kg` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">投球慣用手</p>
                  <p className="text-base font-medium">{student.throwingHand || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">打擊慣用手</p>
                  <p className="text-base font-medium">{student.battingHand || "-"}</p>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">生日</p>
                  <p className="text-base font-medium">{student.birthday || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">年齡</p>
                  <p className="text-base font-medium">{calculateAge(student.birthday) != null ? `${calculateAge(student.birthday)} 歲` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-base font-medium break-all">{student.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">最後檢測</p>
                  <p className="text-base font-medium">{student.lastTest || "-"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team & Coach History Table */}
        {allTeamHistories.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-base font-medium text-foreground mb-4">球隊與教練</h3>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>建立日期</TableHead>
                      <TableHead>所屬球隊</TableHead>
                      <TableHead>層級</TableHead>
                      <TableHead>屬性</TableHead>
                      <TableHead>投/野</TableHead>
                      <TableHead>球隊教練</TableHead>
                      <TableHead>負責教練</TableHead>
                      {/* {canEdit && <TableHead className="w-12"></TableHead>} */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTeamHistories.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(history.created_at).toLocaleDateString("zh-TW")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{getTeamName(history.team_id)}</span>
                            {history.is_current && (
                              <Badge variant="default" className="text-xs">現任</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getTeamById(history.team_id)?.level || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getTeamById(history.team_id)?.attribute || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {student.playerType || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getTeamCoachesForTeam(history.team_id).length > 0
                              ? getTeamCoachesForTeam(history.team_id).map((n) => (
                                  <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                                ))
                              : <span className="text-muted-foreground text-sm">-</span>
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {history.responsibleCoachIds.length > 0
                              ? getCoachNames(history.responsibleCoachIds).map((n) => (
                                  <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                                ))
                              : <span className="text-muted-foreground text-sm">-</span>
                            }
                          </div>
                        </TableCell>
                        {/* {canEdit && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="編輯球隊與教練"
                              onClick={() => navigate(`/students/${studentId}/edit`)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        )} */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      )}
    </AppLayout>
  );
};

export default StudentDetail;
