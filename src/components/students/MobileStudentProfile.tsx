import { useNavigate } from "react-router-dom";
import { Edit, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { useTeams } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import type { TeamHistoryWithCoaches } from "@/hooks/useStudentTeamHistory";
import { calculateAge } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  position?: string;
  playerType?: string;
  height?: string | number;
  weight?: string | number;
  throwingHand?: string;
  battingHand?: string;
  birthday?: string;
  email?: string;
  lastTest?: string;
  teamCoaches: string[];
  responsibleCoaches: string[];
}

interface MobileStudentProfileProps {
  student: Student;
  allTeamHistories?: TeamHistoryWithCoaches[];
}

const MobileStudentProfile = ({ student, allTeamHistories = [] }: MobileStudentProfileProps) => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const { getTeamById, getCoachesByTeam } = useTeams();
  const { accounts } = useAccounts();
  const canEdit = permissions.students.canEdit;

  const getTeamName = (tid: string) => getTeamById(tid)?.name || tid;
  const getTeamCoachesForTeam = (tid: string) => getCoachesByTeam(tid).map((c) => c.name);
  const getCoachNames = (ids: string[]) =>
    ids.map((id) => accounts.find((a) => a.id === id)?.name).filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button 
            size="sm"
            onClick={() => navigate(`/students/${student.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            編輯
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">姓名</p>
                <p className="text-base font-medium">{student.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">投/野</p>
                <p className="text-base font-medium">{student.playerType || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">層級</p>
                <p className="text-base font-medium">{student.level || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">位置</p>
                <p className="text-base font-medium">{student.position || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">身高</p>
                <p className="text-base font-medium">{student.height ? `${student.height} cm` : "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">體重</p>
                <p className="text-base font-medium">{student.weight ? `${student.weight} kg` : "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">投球慣用手</p>
                <p className="text-base font-medium">{student.throwingHand || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">打擊慣用手</p>
                <p className="text-base font-medium">{student.battingHand || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">生日</p>
                <p className="text-base font-medium">{student.birthday || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">年齡</p>
                <p className="text-base font-medium">{calculateAge(student.birthday) != null ? `${calculateAge(student.birthday)} 歲` : "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-base font-medium break-all">{student.email || "-"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">最後檢測</p>
                <p className="text-base font-medium">{student.lastTest || "-"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team & Coach History - Card list for mobile */}
      {allTeamHistories.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-base font-medium text-foreground mb-3">球隊與教練</h3>
            <div className="space-y-3">
              {allTeamHistories.map((history) => (
                <div key={history.id} className="p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{getTeamName(history.team_id)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(history.created_at).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {history.is_current && (
                        <Badge variant="default" className="text-xs">現任</Badge>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="編輯球隊與教練"
                          onClick={() => navigate(`/students/${student.id}/edit`)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">層級</p>
                        <p className="text-sm">{getTeamById(history.team_id)?.level || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">屬性</p>
                        <p className="text-sm">{getTeamById(history.team_id)?.attribute || "-"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">球隊教練</p>
                      <div className="flex flex-wrap gap-1">
                        {getTeamCoachesForTeam(history.team_id).length > 0 ? (
                          getTeamCoachesForTeam(history.team_id).map((n) => (
                            <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">負責教練</p>
                      <div className="flex flex-wrap gap-1">
                        {history.responsibleCoachIds.length > 0 ? (
                          getCoachNames(history.responsibleCoachIds).map((n) => (
                            <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileStudentProfile;
