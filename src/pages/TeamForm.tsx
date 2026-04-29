import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useDataAccess } from "@/hooks/useDataAccess";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { SearchableSelectMulti } from "@/components/ui/searchable-select-multi";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTeams } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useStudents } from "@/contexts/StudentsContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  teamAttributeOptions,
  countyOptions,
  getTeamLevelOptionsByAttribute,
} from "@/data/teamsConfig";
import { FormSelect } from "@/components/ui/form-select";
import { z } from "zod";

const teamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "請輸入球隊名稱" })
    .max(50, { message: "球隊名稱不得超過 50 個字元" }),
  level: z
    .string()
    .min(1, { message: "請選擇層級" }),
  attribute: z
    .string()
    .min(1, { message: "請選擇球隊屬性" }),
});

interface FormErrors {
  name?: string;
  level?: string;
  attribute?: string;
}

const TeamForm = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { toast } = useToast();
  const { getTeamById, addTeam, updateTeam, deleteTeam } = useTeams();
  const { accounts, getRoleName } = useAccounts();
  const { getStudentsByTeam } = useStudents();
  const { logTeamCreated, logTeamUpdated, logTeamDeleted } = useAuditLog();

  const { accessibleTeamIds, hasFullSiteAccess } = useDataAccess("teams");

  // Check if team has students (can only delete if empty)
  const teamStudents = useMemo(() => {
    if (!teamId) return [];
    return getStudentsByTeam(teamId);
  }, [teamId, getStudentsByTeam]);

  const canDeleteTeam = teamStudents.length === 0;

  const isEditing = !!teamId;
  const existingTeam = isEditing ? getTeamById(teamId) : undefined;

  // Check if user has access to edit this team
  const hasAccess = useMemo(() => {
    if (!isEditing) return true; // Always allow creating new teams
    if (!teamId) return false;
    if (hasFullSiteAccess) return true;
    return accessibleTeamIds.includes(teamId);
  }, [isEditing, teamId, hasFullSiteAccess, accessibleTeamIds]);

  // Redirect if no access
  useEffect(() => {
    if (isEditing && existingTeam && !hasAccess) {
      toast({
        title: "無權限編輯",
        description: "您沒有權限編輯此球隊資料",
        variant: "destructive",
      });
      navigate("/teams", { replace: true });
    }
  }, [isEditing, existingTeam, hasAccess, navigate, toast]);

  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [attribute, setAttribute] = useState("棒球");
  const [county, setCounty] = useState("");
  const [selectedCoachIds, setSelectedCoachIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with existing team data
  useEffect(() => {
    if (existingTeam) {
      setName(existingTeam.name);
      setLevel(existingTeam.level || "");
      setAttribute(existingTeam.attribute || "");
      setCounty(existingTeam.county || "");
      setSelectedCoachIds(existingTeam.coachIds);
    }
  }, [existingTeam]);

  // Track changes
  useEffect(() => {
    if (isEditing && existingTeam) {
      const changed =
        name !== existingTeam.name ||
        level !== (existingTeam.level || "") ||
        attribute !== (existingTeam.attribute || "") ||
        county !== (existingTeam.county || "") ||
        JSON.stringify(selectedCoachIds.sort()) !==
          JSON.stringify(existingTeam.coachIds.sort());
      setHasChanges(changed);
    } else {
      setHasChanges(name !== "" || level !== "" || attribute !== "棒球" || county !== "" || selectedCoachIds.length > 0);
    }
  }, [name, level, attribute, county, selectedCoachIds, isEditing, existingTeam]);

  const coachOptions = useMemo(
    () => accounts
      .filter((acc) => acc.active)
      .map((acc) => ({
        value: acc.id,
        label: acc.name,
        description: getRoleName(acc.roleId),
      })),
    [accounts, getRoleName]
  );

  // 依屬性動態切換層級下拉選項（屬性=棒球 → 9 種；屬性=壘球 → 慢速/快速壘球）
  const dynamicLevelOptions = useMemo(
    () => getTeamLevelOptionsByAttribute(attribute),
    [attribute]
  );

  const validateField = (field: keyof FormErrors, value: string) => {
    try {
      teamSchema.shape[field].parse(value);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: err.errors[0]?.message }));
      }
    }
  };

  const handleSubmit = async () => {
    setErrors({});

    const result = teamSchema.safeParse({ name, level, attribute });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && teamId) {
        await updateTeam(teamId, {
          name,
          level,
          attribute,
          county: county || undefined,
          coachIds: selectedCoachIds,
        });
        
        // Log team update
        const coachNames = selectedCoachIds
          .map((id) => accounts.find((a) => a.id === id)?.name)
          .filter(Boolean);
        await logTeamUpdated(teamId, name, {
          coachIds: selectedCoachIds,
          coachNames,
        });
        
        toast({
          title: "球隊已更新",
          description: `${name} 的資料已成功更新`,
        });
      } else {
        const newTeam = await addTeam({
          name,
          level,
          attribute,
          county: county || undefined,
          coachIds: selectedCoachIds,
        });
        
        // Log team creation
        await logTeamCreated(newTeam.id, name);
        
        toast({
          title: "球隊已新增",
          description: `${name} 已成功新增`,
        });
      }
      navigate("/teams");
    } catch (error) {
      toast({
        title: "操作失敗",
        description: "請稍後再試",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (teamId) {
      await deleteTeam(teamId);
      
      // Log team deletion
      await logTeamDeleted(teamId, name);
      
      toast({
        title: "球隊已刪除",
        description: `${name} 已成功刪除`,
      });
      navigate("/teams");
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/teams");
    }
  };

  const pageTitle = isEditing ? "編輯球隊" : "新增球隊";

  // Show unauthorized state while redirecting
  if (isEditing && !hasAccess) {
    return (
      <AppLayout title="無權限">
        <div className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">無權限編輯此球隊</h2>
          <p className="text-muted-foreground mb-4">您沒有權限編輯此球隊資料</p>
          <Button variant="outline" onClick={() => navigate("/teams")}>
            返回球隊列表
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={pageTitle}
      headerAction={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "儲存中..." : "新增中..."}
              </>
            ) : (
              isEditing ? "儲存變更" : "新增球隊"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          items={
            isEditing && existingTeam
              ? [
                  { label: "球隊管理", path: "/teams" },
                  { label: existingTeam.name, path: `/teams/${teamId}` },
                  { label: "編輯" },
                ]
              : [
                  { label: "球隊管理", path: "/teams" },
                  { label: "新增球隊" },
                ]
          }
        />

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">球隊資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <FormField
                  label="球隊名稱"
                  required
                  error={errors.name}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) validateField("name", e.target.value);
                  }}
                  onBlur={() => validateField("name", name)}
                  placeholder="請輸入球隊名稱"
                />
              </div>

              <FormSelect
                label="球隊屬性"
                required
                value={attribute}
                onValueChange={(value) => {
                  // 切換屬性時 reset 層級，使用者必須重新選層級（不保留前次選值）
                  if (value !== attribute) {
                    setLevel("");
                  }
                  setAttribute(value);
                  if (errors.attribute) setErrors((prev) => ({ ...prev, attribute: undefined }));
                }}
                placeholder="請選擇屬性"
                options={teamAttributeOptions}
                error={errors.attribute}
              />

              <FormSelect
                label="層級"
                required
                value={level}
                onValueChange={(value) => {
                  setLevel(value);
                  if (errors.level) setErrors((prev) => ({ ...prev, level: undefined }));
                }}
                placeholder="請選擇層級"
                options={dynamicLevelOptions}
                error={errors.level}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormSelect
                label="所屬縣市"
                value={county}
                onValueChange={setCounty}
                placeholder="請選擇縣市"
                options={countyOptions}
              />
            </div>

            <SearchableSelectMulti
              label="負責教練"
              options={coachOptions}
              values={selectedCoachIds}
              onChange={setSelectedCoachIds}
              placeholder="選擇負責教練..."
              searchPlaceholder="搜尋教練..."
              description="可選擇多位教練負責此球隊"
              maxItems={10}
            />
          </CardContent>
        </Card>

        {/* Delete Section */}
        {isEditing && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                危險區域
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">刪除此球隊</p>
                  <p className="text-sm text-muted-foreground">
                    {canDeleteTeam 
                      ? "刪除後將無法復原，相關的課表資料可能受影響"
                      : `此球隊目前有 ${teamStudents.length} 位學員，需先移除所有學員才能刪除球隊`
                    }
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={!canDeleteTeam}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  刪除球隊
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此球隊？</AlertDialogTitle>
            <AlertDialogDescription>
              刪除後將無法復原。相關的學員資料與課表可能需要重新調整。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要離開？</AlertDialogTitle>
            <AlertDialogDescription>
              您有尚未儲存的變更，離開後將會遺失這些變更。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/teams")}>
              確定離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default TeamForm;
