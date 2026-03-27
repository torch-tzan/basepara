import { useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit, Users, ChevronRight, Calendar, FileText, AlertTriangle, Pencil } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { useTeams } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useStudents } from "@/contexts/StudentsContext";
import { useDataAccess } from "@/hooks/useDataAccess";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";
import { calculateAge } from "@/lib/utils";

const TeamDetail = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { getTeamById } = useTeams();
  const { accounts, getRoleName } = useAccounts();
  const { students } = useStudents();
  const { accessibleTeamIds, hasFullSiteAccess } = useDataAccess("teams");
  const { permissions } = usePermissions();
  const canEditStudents = permissions.students.canEdit;

  const team = teamId ? getTeamById(teamId) : undefined;
  
  // Check if user has access to this team
  const hasAccess = useMemo(() => {
    if (!teamId) return false;
    if (hasFullSiteAccess) return true;
    return accessibleTeamIds.includes(teamId);
  }, [teamId, hasFullSiteAccess, accessibleTeamIds]);

  // Redirect if no access
  useEffect(() => {
    if (team && !hasAccess) {
      toast({
        title: "無權限檢視",
        description: "您沒有權限檢視此球隊資料",
        variant: "destructive",
      });
      navigate("/teams", { replace: true });
    }
  }, [team, hasAccess, navigate]);

  const coaches = team
    ? accounts.filter((acc) => team.coachIds.includes(acc.id))
    : [];

  const teamStudents = useMemo(() => {
    if (!teamId) return [];
    return students.filter((s) => s.teamId === teamId);
  }, [students, teamId]);

  // Show not found if team doesn't exist
  if (!team) {
    return (
      <AppLayout title="球隊詳情">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">找不到該球隊</p>
          <Button variant="outline" onClick={() => navigate("/teams")}>
            返回球隊列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  // Show no access message while redirecting
  if (!hasAccess) {
    return (
      <AppLayout title="球隊詳情">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-muted-foreground mb-4">您沒有權限檢視此球隊資料</p>
          <Button variant="outline" onClick={() => navigate("/teams")}>
            返回球隊列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={team.name}
      headerAction={
        <Button onClick={() => navigate(`/teams/${teamId}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          編輯
        </Button>
      }
    >
      <div className="space-y-6">
        <PageBreadcrumb
          items={[
            { label: "球隊管理", path: "/teams" },
            { label: team.name },
          ]}
        />

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">球隊名稱</p>
                <p className="text-base font-medium">{team.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">層級</p>
                <p className="text-base font-medium">{team.level || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">球隊屬性</p>
                <p className="text-base font-medium">{team.attribute || "-"}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">教練名單</p>
              </div>
              {coaches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {coaches.map((coach) => (
                    <Badge key={coach.id} variant="secondary" className="text-sm py-1 px-3">
                      {coach.name}
                      <span className="ml-1.5 text-muted-foreground">
                        ({getRoleName(coach.roleId)})
                      </span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">尚未指派教練</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Students List */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">球員名單</CardTitle>
            <span className="text-sm text-muted-foreground">
              共 {teamStudents.length} 名球員
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>學員姓名</TableHead>
                  <TableHead>所屬球隊</TableHead>
                  <TableHead>屬性</TableHead>
                  <TableHead>投/野</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>年齡</TableHead>
                  <TableHead>負責教練</TableHead>
                  <TableHead>最後檢測</TableHead>
                  <TableHead>最後訓練</TableHead>
                  <TableHead className="text-center">快速操作</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamStudents.length > 0 ? (
                  teamStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/students/${student.id}`)}
                    >
                      <TableCell>
                        <span className="font-medium">{student.name}</span>
                      </TableCell>
                      <TableCell>{student.teamName}</TableCell>
                      <TableCell className="text-muted-foreground">{team.attribute || "-"}</TableCell>
                      <TableCell>{student.playerType || "-"}</TableCell>
                      <TableCell>{student.position || "-"}</TableCell>
                      <TableCell>{calculateAge(student.birthday) ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.responsibleCoaches.slice(0, 3).map((coach, idx) => (
                            <Badge key={idx} variant="outline" className="font-normal text-xs">
                              {coach}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{student.lastTest || "-"}</TableCell>
                      <TableCell>{student.lastTraining || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {canEditStudents && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              title="編輯學員"
                              onClick={() => navigate(`/students/${student.id}/edit`)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="查看課表"
                            onClick={() => navigate(`/schedule?student=${student.id}`)}
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="查看檢測報告"
                            onClick={() => navigate(`/reports?student=${student.id}`)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      尚無球員資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default TeamDetail;
