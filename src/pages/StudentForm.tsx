import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { Trash2, KeyRound, Loader2, Plus, Archive, ArchiveRestore, Star, User, Settings, Pencil } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { FormDatePicker } from "@/components/ui/form-datepicker";
import { FormSelect } from "@/components/ui/form-select";
import { SearchableSelectMulti } from "@/components/ui/searchable-select-multi";
import { Label } from "@/components/ui/label";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEmailValidation } from "@/hooks/useEmailValidation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { teamLevelOptions, countyOptions } from "@/data/teamsConfig";
import { useAccounts } from "@/contexts/AccountsContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  useStudentTeamHistory,
  useAddTeamHistory,
  useDeleteTeamHistory,
  useSetCurrentTeamHistory,
  useUpdateTeamHistory,
} from "@/hooks/useStudentTeamHistory";

// Validation schema
const studentSchema = z.object({
  name: z.string().trim().min(1, "請填寫姓名").max(50, "姓名不可超過 50 字"),
  email: z.string().trim().email("請輸入有效的信箱格式").max(255, "信箱不可超過 255 字"),
  height: z.string().optional(),
  weight: z.string().optional(),
  birthday: z.date().optional(),
  position: z.string().optional(),
  throwingHand: z.string().optional(),
  battingHand: z.string().optional(),
  teamId: z.string().min(1, "請選擇所屬球隊"),
  responsibleCoaches: z.array(z.string()).max(3, "最多選擇 3 位負責教練"),
});

// Editing mode schema - teamId not required (managed via table)
const studentSchemaEditing = studentSchema.omit({ teamId: true, responsibleCoaches: true });

// Format date to string
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

const StudentForm = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { toast } = useToast();
  const { getStudentById, addStudent, updateStudent, deleteStudent, archiveStudent, unarchiveStudent, archivedStudents } = useStudents();
  const { teams, getCoachesByTeam } = useTeams();
  const { accounts, getRoleName } = useAccounts();
  const { validateEmail } = useEmailValidation();
  const { logStudentCreated, logStudentUpdated, logStudentDeleted } = useAuditLog();
  const isEditing = !!studentId && studentId !== "add";
  const isInitialized = useRef(false);
  const isArchived = isEditing && !!archivedStudents.find(s => s.id === studentId);

  // Team history hooks
  const { data: teamHistoryData } = useStudentTeamHistory(isEditing ? studentId : undefined);
  const addTeamHistoryMutation = useAddTeamHistory();
  const updateTeamHistoryMutation = useUpdateTeamHistory();
  const deleteTeamHistoryMutation = useDeleteTeamHistory();
  const setCurrentTeamHistoryMutation = useSetCurrentTeamHistory();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthday, setBirthday] = useState<Date | undefined>();
  const [position, setPosition] = useState("");
  const [throwingHand, setThrowingHand] = useState("");
  const [battingHand, setBattingHand] = useState("");
  const [playerType, setPlayerType] = useState("");
  const [level, setLevel] = useState("");
  const [county, setCounty] = useState("");
  // For new student mode only
  const [teamId, setTeamId] = useState("");
  const [responsibleCoaches, setResponsibleCoaches] = useState<string[]>([]);
  
  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "account">("profile");

  // Add/Edit team dialog state
  const [showAddTeamDialog, setShowAddTeamDialog] = useState(false);
  const [newTeamId, setNewTeamId] = useState("");
  const [newResponsibleCoaches, setNewResponsibleCoaches] = useState<string[]>([]);
  
  const [showEditTeamDialog, setShowEditTeamDialog] = useState(false);
  const [editHistoryId, setEditHistoryId] = useState("");
  const [editTeamId, setEditTeamId] = useState("");
  const [editResponsibleCoaches, setEditResponsibleCoaches] = useState<string[]>([]);
  const [editIsCurrent, setEditIsCurrent] = useState(false);

  // Delete/set current confirmation state
  const [showDeleteHistoryDialog, setShowDeleteHistoryDialog] = useState(false);
  const [showSetCurrentDialog, setShowSetCurrentDialog] = useState(false);
  const [targetHistoryId, setTargetHistoryId] = useState("");
  const [targetTeamId, setTargetTeamId] = useState("");

  // Map account IDs to names
  const mapCoachIdsToNames = (ids: string[]): string[] => {
    return ids
      .map((id) => accounts.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];
  };

  // Map coach names to account IDs
  const mapCoachNamesToIds = (names: string[]): string[] => {
    return names
      .map((name) => accounts.find((a) => a.name === name)?.id)
      .filter(Boolean) as string[];
  };

  // Coach options for selection
  const coachAccountOptions = useMemo(() => {
    return accounts
      .filter((acc) => acc.active)
      .map((acc) => ({
        value: acc.id,
        label: acc.name,
        description: getRoleName(acc.roleId),
      }));
  }, [accounts, getRoleName]);

  // Team options
  const teamOptions = useMemo(() => 
    teams.map((t) => ({ value: t.id, label: t.name })),
    [teams]
  );

  // Position options
  const positionOptions = [
    { value: "投手", label: "投手" },
    { value: "捕手", label: "捕手" },
    { value: "內野手", label: "內野手" },
    { value: "外野手", label: "外野手" },
  ];

  // Hand options
  const handOptions = [
    { value: "右", label: "右" },
    { value: "左", label: "左" },
  ];

  // Get team coaches for display
  const teamCoaches = useMemo(() => {
    const coaches = getCoachesByTeam(teamId);
    return coaches.map((c) => c.name);
  }, [teamId, getCoachesByTeam]);

  // Get team name helper
  const getTeamName = (tid: string) => teams.find((t) => t.id === tid)?.name || tid;

  // Get coach names for a history record
  const getCoachNamesForHistory = (coachIds: string[]): string[] => {
    return coachIds
      .map((id) => accounts.find((a) => a.id === id)?.name)
      .filter(Boolean) as string[];
  };

  // Get team coaches for a specific team
  const getTeamCoachesForTeam = (tid: string): string[] => {
    const coaches = getCoachesByTeam(tid);
    return coaches.map((c) => c.name);
  };

  // Load existing student data for editing
  useEffect(() => {
    if (isEditing && studentId && !isInitialized.current) {
      const student = getStudentById(studentId);
      if (student) {
        setName(student.name);
        setEmail(student.email);
        setHeight(student.height);
        setWeight(student.weight);
        if (student.birthday) {
          const [year, month, day] = student.birthday.split("/").map(Number);
          setBirthday(new Date(year, month - 1, day));
        }
        setPosition(student.position);
        setPlayerType(student.playerType || "");
        setLevel(student.level || "");
        setCounty(student.county || "");
        setThrowingHand(student.throwingHand || "");
        setBattingHand(student.battingHand || "");
        setTeamId(student.teamId);
        const coachIds = mapCoachNamesToIds(student.responsibleCoaches);
        setResponsibleCoaches(coachIds.length > 0 ? coachIds : []);
        isInitialized.current = true;
      }
    }
  }, [isEditing, studentId, getStudentById]);

  // Track form changes (skip initial load)
  useEffect(() => {
    if (isInitialized.current || !isEditing) {
      setIsDirty(true);
    }
  }, [name, email, height, weight, birthday, position, throwingHand, battingHand, level, county, teamId, responsibleCoaches, isEditing]);

  // Validate form
  const validateForm = (): boolean => {
    try {
      if (isEditing) {
        studentSchemaEditing.parse({
          name, email, height, weight, birthday, position, throwingHand, battingHand,
        });
      } else {
        studentSchema.parse({
          name, email, height, weight, birthday, position, throwingHand, battingHand,
          teamId, responsibleCoaches,
        });
      }
      
      const emailResult = validateEmail(email, { excludeStudentId: studentId });
      if (!emailResult.isValid) {
        setErrors({ email: emailResult.error });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "表單驗證失敗",
        description: "請檢查並修正錯誤欄位",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const currentHistory = (teamHistoryData || []).find(h => h.is_current);

      const formData = {
        name: name.trim(),
        email: email.trim(),
        height,
        weight,
        birthday: birthday ? formatDateToString(birthday) : undefined,
        position,
        playerType,
        throwingHand,
        battingHand,
        level: level || undefined,
        county: county || undefined,
        teamId: isEditing ? (currentHistory?.team_id || teamId) : teamId,
        responsibleCoaches: isEditing 
          ? mapCoachIdsToNames(currentHistory?.responsibleCoachIds || [])
          : mapCoachIdsToNames(responsibleCoaches),
      };

      const teamName = teams.find((t) => t.id === formData.teamId)?.name;

      if (isEditing && studentId) {
        // Only update basic student info - team history is managed via table actions
        await updateStudent(studentId, formData);
        
        await logStudentUpdated(studentId, name.trim(), {
          email: email.trim(),
          teamId: formData.teamId,
          teamName,
        });
        
        toast({
          title: "編輯成功",
          description: `已成功更新學員：${name}`,
        });
      } else {
        const newStudent = await addStudent(formData);
        
        // Create initial team history for new student
        await addTeamHistoryMutation.mutateAsync({
          student_id: newStudent.id,
          team_id: teamId,
          responsibleCoachIds: responsibleCoaches.length > 0
            ? responsibleCoaches
            : mapCoachNamesToIds(formData.responsibleCoaches),
        });
        
        await logStudentCreated(newStudent.id, name.trim());
        
        toast({
          title: "新增成功",
          description: `已成功新增學員：${name}`,
        });
      }

      setIsDirty(false);
      navigate("/students");
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        variant: "destructive",
        title: "操作失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle add new team via dialog
  const handleConfirmAddTeam = async () => {
    if (!studentId || !newTeamId) return;

    setShowAddTeamDialog(false);
    
    try {
      await addTeamHistoryMutation.mutateAsync({
        student_id: studentId,
        team_id: newTeamId,
        responsibleCoachIds: newResponsibleCoaches,
      });

      toast({
        title: "已新增球隊紀錄",
        description: `已將「${getTeamName(newTeamId)}」設為現任球隊`,
      });

      setNewTeamId("");
      setNewResponsibleCoaches([]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "新增失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    }
  };

  // Handle edit team
  const handleConfirmEditTeam = async () => {
    if (!studentId || !editHistoryId || !editTeamId) return;

    setShowEditTeamDialog(false);

    try {
      await updateTeamHistoryMutation.mutateAsync({
        history_id: editHistoryId,
        student_id: studentId,
        team_id: editTeamId,
        responsibleCoachIds: editResponsibleCoaches,
        is_current: editIsCurrent,
      });

      toast({
        title: "已更新球隊紀錄",
        description: `已更新「${getTeamName(editTeamId)}」的紀錄`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "更新失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    }
  };

  // Handle delete team history
  const handleConfirmDeleteHistory = async () => {
    if (!studentId || !targetHistoryId) return;

    setShowDeleteHistoryDialog(false);

    try {
      await deleteTeamHistoryMutation.mutateAsync({
        history_id: targetHistoryId,
        student_id: studentId,
      });

      toast({
        title: "已刪除球隊紀錄",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "刪除失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    }
  };

  // Handle set current team history
  const handleConfirmSetCurrent = async () => {
    if (!studentId || !targetHistoryId) return;

    setShowSetCurrentDialog(false);

    try {
      await setCurrentTeamHistoryMutation.mutateAsync({
        history_id: targetHistoryId,
        student_id: studentId,
        team_id: targetTeamId,
      });

      toast({
        title: "已更新現任球隊",
        description: `已將「${getTeamName(targetTeamId)}」設為現任球隊`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "更新失敗",
        description: error instanceof Error ? error.message : "請稍後再試",
      });
    }
  };

  // Handle navigation with unsaved changes check
  const handleNavigate = (path: string) => {
    if (isDirty) {
      setPendingNavigation(path);
      setShowUnsavedDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleCancel = () => {
    handleNavigate("/students");
  };

  const confirmNavigation = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (studentId) {
      await deleteStudent(studentId);
      await logStudentDeleted(studentId, name);
      toast({
        title: "學員已刪除",
        description: `已成功刪除學員：${name}`,
      });
    }
    setShowDeleteDialog(false);
    navigate("/students");
  };

  const handleResetPassword = () => {
    setShowResetPasswordDialog(true);
  };

  const confirmResetPassword = () => {
    setShowResetPasswordDialog(false);
    toast({
      title: "密碼重置連結已發送",
      description: `已發送重置密碼連結至 ${email}`,
    });
  };

  // New team coaches for add dialog
  const newTeamCoaches = useMemo(() => {
    if (!newTeamId) return [];
    return getTeamCoachesForTeam(newTeamId);
  }, [newTeamId, getCoachesByTeam]);

  // Edit team coaches for edit dialog
  const editTeamCoaches = useMemo(() => {
    if (!editTeamId) return [];
    return getTeamCoachesForTeam(editTeamId);
  }, [editTeamId, getCoachesByTeam]);

  return (
    <AppLayout
      title={isEditing ? "編輯學員" : "新增學員"}
      headerAction={
        !isEditing ? (
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  新增中...
                </>
              ) : (
                "確認新增"
              )}
            </Button>
          </div>
        ) : undefined
      }
    >
      {/* Breadcrumb */}
      <div className="mb-6">
        <PageBreadcrumb
          items={
            isEditing && studentId
              ? [
                  { label: "學員管理", path: "/students" },
                  { label: name || "學員", path: `/students/${studentId}` },
                  { label: "編輯" },
                ]
              : [
                  { label: "學員管理", path: "/students" },
                  { label: "新增學員" },
                ]
          }
        />
      </div>

      <form onSubmit={handleSubmit}>
        {isEditing ? (
          <>
            {/* Mobile: horizontal tabs */}
            <div className="md:hidden mb-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "profile" | "account")}>
                <TabsList className="w-full">
                  <TabsTrigger value="profile" className="flex-1 gap-1.5">
                    <User className="w-4 h-4" />
                    學員資料
                  </TabsTrigger>
                  <TabsTrigger value="account" className="flex-1 gap-1.5">
                    <Settings className="w-4 h-4" />
                    帳號設定
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Desktop: sidebar + content */}
            <div className="flex gap-6">
              {/* Desktop sidebar nav */}
              <nav className="hidden md:flex flex-col w-48 shrink-0 pt-0 mt-0">
                <div className="sticky top-24 space-y-1 pt-0 mt-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("profile")}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                      activeTab === "profile"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <User className="w-4 h-4" />
                    學員資料
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("account")}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors text-left",
                      activeTab === "account"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    帳號設定
                  </button>
                </div>
              </nav>

              {/* Tab content */}
              <div className="flex-1 min-w-0">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Basic info */}
                    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                      <h2 className="text-lg font-medium text-foreground">基本資料</h2>
                      <FormField label="姓名" required placeholder="請輸入學員姓名" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
                      <FormField label="信箱" required type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} description={!errors.email ? "此信箱將作為學員的登入帳號" : undefined} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <FormDatePicker label="生日" value={birthday} onChange={setBirthday} placeholder="選擇生日" disabled={(date) => date > new Date() || date < new Date("1990-01-01")} showYearDropdown fromYear={1990} toYear={new Date().getFullYear()} />
                        <FormField label="身高 (cm)" type="number" placeholder="例如：175" value={height} onChange={(e) => setHeight(e.target.value)} />
                        <FormField label="體重 (kg)" type="number" placeholder="例如：68" value={weight} onChange={(e) => setWeight(e.target.value)} />
                        <FormSelect
                          label="層級"
                          value={level}
                          onValueChange={setLevel}
                          placeholder="選擇層級"
                          options={teamLevelOptions}
                        />
                        <FormSelect
                          label="縣市"
                          value={county}
                          onValueChange={setCounty}
                          placeholder="選擇縣市"
                          options={countyOptions}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <FormSelect label="投/野" value={playerType} onValueChange={setPlayerType} placeholder="選擇" options={[{ value: "投手", label: "投手" }, { value: "野手", label: "野手" }]} />
                        <FormSelect label="守備位置" value={position} onValueChange={setPosition} placeholder="選擇守備位置" options={positionOptions} />
                        <FormSelect label="投球慣用手" value={throwingHand} onValueChange={setThrowingHand} placeholder="選擇" options={handOptions} />
                        <FormSelect label="打擊慣用手" value={battingHand} onValueChange={setBattingHand} placeholder="選擇" options={handOptions} />
                      </div>
                    </div>

                    {/* Team & Coach table */}
                    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-foreground">球隊與教練</h2>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setNewTeamId(""); setNewResponsibleCoaches([]); setShowAddTeamDialog(true); }}>
                          <Plus className="w-4 h-4 mr-2" />
                          新增球隊
                        </Button>
                      </div>
                      {teamHistoryData && teamHistoryData.length > 0 ? (
                        <>
                          {/* Desktop table */}
                          <div className="hidden md:block rounded-md border border-border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>建立日期</TableHead>
                                  <TableHead>所屬球隊</TableHead>
                                  <TableHead>層級</TableHead>
                                  <TableHead>屬性</TableHead>
                                  <TableHead>球隊教練</TableHead>
                                  <TableHead>負責教練</TableHead>
                                  <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {teamHistoryData.map((history) => (
                                  <TableRow key={history.id}>
                                    <TableCell className="whitespace-nowrap">{new Date(history.created_at).toLocaleDateString("zh-TW")}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span>{getTeamName(history.team_id)}</span>
                                        {history.is_current && <Badge variant="default" className="text-xs">現任</Badge>}
                                      </div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{teams.find(t => t.id === history.team_id)?.level || "-"}</TableCell>
                                    <TableCell className="whitespace-nowrap">{teams.find(t => t.id === history.team_id)?.attribute || "-"}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {getTeamCoachesForTeam(history.team_id).length > 0
                                          ? getTeamCoachesForTeam(history.team_id).map((n) => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)
                                          : <span className="text-muted-foreground text-sm">-</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {history.responsibleCoachIds.length > 0
                                          ? getCoachNamesForHistory(history.responsibleCoachIds).map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)
                                          : <span className="text-muted-foreground text-sm">-</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => {
                                            setEditHistoryId(history.id);
                                            setEditTeamId(history.team_id);
                                            setEditResponsibleCoaches(history.responsibleCoachIds);
                                            setEditIsCurrent(history.is_current);
                                            setShowEditTeamDialog(true);
                                          }}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        {!history.is_current && (
                                          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={() => { setTargetHistoryId(history.id); setTargetTeamId(history.team_id); setShowSetCurrentDialog(true); }}>
                                            <Star className="w-3 h-3 mr-1" />設為現任
                                          </Button>
                                        )}
                                        {teamHistoryData.length > 1 && (
                                          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => { setTargetHistoryId(history.id); setTargetTeamId(history.team_id); setShowDeleteHistoryDialog(true); }}>
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          {/* Mobile card list */}
                          <div className="md:hidden space-y-3">
                            {teamHistoryData.map((history) => (
                              <div key={history.id} className="p-3 rounded-lg border border-border bg-muted/30">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-foreground text-sm">{getTeamName(history.team_id)}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(history.created_at).toLocaleDateString("zh-TW")}</p>
                                  </div>
                                  {history.is_current && <Badge variant="default" className="text-xs">現任</Badge>}
                                </div>
                                <div className="space-y-2">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div><p className="text-xs text-muted-foreground font-medium mb-1">層級</p><p className="text-sm">{teams.find(t => t.id === history.team_id)?.level || "-"}</p></div>
                                    <div><p className="text-xs text-muted-foreground font-medium mb-1">屬性</p><p className="text-sm">{teams.find(t => t.id === history.team_id)?.attribute || "-"}</p></div>
                                  </div>
                                  <div><p className="text-xs text-muted-foreground font-medium mb-1">球隊教練</p><div className="flex flex-wrap gap-1">{getTeamCoachesForTeam(history.team_id).length > 0 ? getTeamCoachesForTeam(history.team_id).map((n) => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>) : <span className="text-xs text-muted-foreground">-</span>}</div></div>
                                  <div><p className="text-xs text-muted-foreground font-medium mb-1">負責教練</p><div className="flex flex-wrap gap-1">{history.responsibleCoachIds.length > 0 ? getCoachNamesForHistory(history.responsibleCoachIds).map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>) : <span className="text-xs text-muted-foreground">-</span>}</div></div>
                                </div>
                                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setEditHistoryId(history.id);
                                      setEditTeamId(history.team_id);
                                      setEditResponsibleCoaches(history.responsibleCoachIds);
                                      setEditIsCurrent(history.is_current);
                                      setShowEditTeamDialog(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  {!history.is_current && (
                                    <Button type="button" variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setTargetHistoryId(history.id); setTargetTeamId(history.team_id); setShowSetCurrentDialog(true); }}>
                                      <Star className="w-3 h-3 mr-1" />設為現任
                                    </Button>
                                  )}
                                  {teamHistoryData.length > 1 && (
                                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive h-7" onClick={() => { setTargetHistoryId(history.id); setTargetTeamId(history.team_id); setShowDeleteHistoryDialog(true); }}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">尚無球隊紀錄，請點擊「新增球隊」建立。</p>
                      )}
                    </div>

                    {/* Save/Cancel buttons in profile tab */}
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                        取消
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />儲存中...</>
                        ) : "儲存變更"}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="space-y-6">
                    {/* Password management */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h2 className="text-lg font-medium text-foreground mb-2">密碼管理</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        點擊後將發送重置密碼連結至學員的 Email，學員可透過連結設定新密碼。
                      </p>
                      <Button type="button" variant="outline" className="gap-2" onClick={handleResetPassword}>
                        <KeyRound className="w-4 h-4" />
                        重置密碼
                      </Button>
                    </div>

                    {/* Archive section */}
                    <div className="bg-card rounded-lg border border-border p-6">
                      <h2 className="text-lg font-medium text-foreground mb-2">
                        {isArchived ? "解除封存" : "封存學員"}
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        {isArchived
                          ? "解除封存後，學員將重新顯示於課表、訓練紀錄、檢測報告等模組中。"
                          : "封存後，學員將不再顯示於課表、訓練紀錄、檢測報告等模組中，僅能在已封存列表中查看。"}
                      </p>
                      <Button type="button" variant={isArchived ? "outline" : "secondary"} className="gap-2" onClick={() => setShowArchiveDialog(true)}>
                        {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        {isArchived ? "解除封存" : "封存學員"}
                      </Button>
                    </div>

                    {/* Delete section */}
                    <div className="bg-card rounded-lg border border-destructive/30 p-6">
                      <h2 className="text-lg font-medium text-foreground mb-2">刪除學員</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        刪除學員將會移除該學員的所有相關資料，包含課表安排與檢測報告紀錄。此操作無法復原。
                      </p>
                      <Button type="button" variant="destructive" className="gap-2" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                        刪除學員
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* New student mode - single page */
          <>
            <div className="bg-card rounded-lg border border-border p-6 space-y-6">
              <h2 className="text-lg font-medium text-foreground">基本資料</h2>
              <FormField label="姓名" required placeholder="請輸入學員姓名" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
              <FormField label="信箱" required type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} description={!errors.email ? "此信箱將作為學員的登入帳號" : undefined} />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormDatePicker label="生日" value={birthday} onChange={setBirthday} placeholder="選擇生日" disabled={(date) => date > new Date() || date < new Date("1990-01-01")} showYearDropdown fromYear={1990} toYear={new Date().getFullYear()} />
                <FormField label="身高 (cm)" type="number" placeholder="例如：175" value={height} onChange={(e) => setHeight(e.target.value)} />
                <FormField label="體重 (kg)" type="number" placeholder="例如：68" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <FormSelect
                  label="層級"
                  value={level}
                  onValueChange={setLevel}
                  placeholder="選擇層級"
                  options={teamLevelOptions}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <FormSelect label="投/野" value={playerType} onValueChange={setPlayerType} placeholder="選擇" options={[{ value: "投手", label: "投手" }, { value: "野手", label: "野手" }]} />
                <FormSelect label="守備位置" value={position} onValueChange={setPosition} placeholder="選擇守備位置" options={positionOptions} />
                <FormSelect label="投球慣用手" value={throwingHand} onValueChange={setThrowingHand} placeholder="選擇" options={handOptions} />
                <FormSelect label="打擊慣用手" value={battingHand} onValueChange={setBattingHand} placeholder="選擇" options={handOptions} />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 space-y-6 mt-6">
              <h2 className="text-lg font-medium text-foreground">球隊與教練</h2>
              <FormSelect
                label="所屬球隊"
                required
                value={teamId}
                onValueChange={(v) => {
                  setTeamId(v);
                  const t = teams.find((x) => x.id === v);
                  // 切換球隊時若層級尚未手動指定，自動帶入該球隊層級
                  if (!level && t?.level) {
                    setLevel(t.level);
                  }
                  // 切換球隊時若縣市尚未手動指定，自動帶入該球隊縣市
                  if (!county && t?.county) {
                    setCounty(t.county);
                  }
                }}
                placeholder="選擇所屬球隊"
                options={teamOptions}
                error={errors.teamId}
              />
              {teamId && (
                <FormSelect
                  label="縣市"
                  value={county}
                  onValueChange={setCounty}
                  placeholder="選擇縣市"
                  options={countyOptions}
                  description="選擇球隊時會自動帶入該球隊縣市，可手動覆寫"
                />
              )}
              {teamId && teamCoaches.length > 0 && (
                <div className="space-y-2">
                  <Label>球隊教練</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-accent/50 rounded-md border border-border">
                    {teamCoaches.map((coachName) => (
                      <span key={coachName} className="inline-flex items-center px-2.5 py-1 rounded-md bg-background text-sm text-foreground border border-border">{coachName}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">自動帶入所屬球隊的教練</p>
                </div>
              )}
              <SearchableSelectMulti label="負責教練" values={responsibleCoaches} onChange={setResponsibleCoaches} options={coachAccountOptions} placeholder="搜尋並選擇教練..." searchPlaceholder="輸入教練名稱搜尋..." emptyText="找不到符合的教練" maxItems={3} description="從所有管理帳號中選擇 0~3 位負責教練（可選）" error={errors.responsibleCoaches} />
            </div>

            {/* Mobile submit button for new student */}
            <div className="mt-6 flex justify-end gap-3 lg:hidden">
              <Button type="button" variant="outline" onClick={handleCancel}>取消</Button>
              <Button type="submit">確認新增</Button>
            </div>
          </>
        )}
      </form>

      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要離開嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您有未儲存的變更，離開後將會遺失這些資料。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>繼續編輯</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>
              確認離開
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete student confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除學員</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除學員「<span className="font-semibold text-foreground">{name}</span>」嗎？
              <br /><br />
              此操作將會刪除該學員的所有相關資料，包含課表安排與檢測報告紀錄。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password confirmation dialog */}
      <AlertDialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要重置密碼嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              系統將發送重置密碼連結至 <span className="font-semibold text-foreground">{email}</span>，學員可透過連結設定新密碼。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetPassword}>
              確定發送
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add team dialog */}
      <Dialog open={showAddTeamDialog} onOpenChange={setShowAddTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增球隊</DialogTitle>
            <DialogDescription>
              選擇球隊與負責教練，新增後將自動設為現任球隊。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormSelect
              label="所屬球隊"
              required
              value={newTeamId}
              onValueChange={setNewTeamId}
              placeholder="選擇所屬球隊"
              options={teamOptions}
            />

            {newTeamId && newTeamCoaches.length > 0 && (
              <div className="space-y-2">
                <Label>球隊教練</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-accent/50 rounded-md border border-border">
                  {newTeamCoaches.map((coachName) => (
                    <span
                      key={coachName}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-background text-sm text-foreground border border-border"
                    >
                      {coachName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <SearchableSelectMulti
              label="負責教練"
              values={newResponsibleCoaches}
              onChange={setNewResponsibleCoaches}
              options={coachAccountOptions}
              placeholder="搜尋並選擇教練..."
              searchPlaceholder="輸入教練名稱搜尋..."
              emptyText="找不到符合的教練"
              maxItems={3}
              description="從所有管理帳號中選擇 0~3 位負責教練（可選）"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTeamDialog(false)}>取消</Button>
            <Button onClick={handleConfirmAddTeam} disabled={!newTeamId}>確認新增</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit team dialog */}
      <Dialog open={showEditTeamDialog} onOpenChange={setShowEditTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯球隊紀錄</DialogTitle>
            <DialogDescription>
              編輯球隊與負責教練資訊。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <FormSelect
              label="所屬球隊"
              required
              value={editTeamId}
              onValueChange={setEditTeamId}
              placeholder="選擇所屬球隊"
              options={teamOptions}
            />

            {editTeamId && editTeamCoaches.length > 0 && (
              <div className="space-y-2">
                <Label>球隊教練</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-accent/50 rounded-md border border-border">
                  {editTeamCoaches.map((coachName) => (
                    <span
                      key={coachName}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-background text-sm text-foreground border border-border"
                    >
                      {coachName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <SearchableSelectMulti
              label="負責教練"
              values={editResponsibleCoaches}
              onChange={setEditResponsibleCoaches}
              options={coachAccountOptions}
              placeholder="搜尋並選擇教練..."
              searchPlaceholder="輸入教練名稱搜尋..."
              emptyText="找不到符合的教練"
              maxItems={3}
              description="從所有管理帳號中選擇 0~3 位負責教練（可選）"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTeamDialog(false)}>取消</Button>
            <Button onClick={handleConfirmEditTeam} disabled={!editTeamId}>確認更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete team history confirmation dialog */}
      <AlertDialog open={showDeleteHistoryDialog} onOpenChange={setShowDeleteHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除球隊紀錄</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除「<span className="font-semibold text-foreground">{getTeamName(targetTeamId)}</span>」的球隊紀錄嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set current team confirmation dialog */}
      <AlertDialog open={showSetCurrentDialog} onOpenChange={setShowSetCurrentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認設為現任球隊</AlertDialogTitle>
            <AlertDialogDescription>
              確定要將「<span className="font-semibold text-foreground">{getTeamName(targetTeamId)}</span>」設為現任球隊嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSetCurrent}>
              確認
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived ? "確定要解除封存嗎？" : "確定要封存此學員嗎？"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived ? (
                <>解除封存後，學員「<span className="font-semibold text-foreground">{name}</span>」將重新顯示於課表、訓練紀錄、檢測報告等模組中。</>
              ) : (
                <>封存後，學員「<span className="font-semibold text-foreground">{name}</span>」將不再顯示於課表、訓練紀錄、檢測報告等模組中，僅能在已封存列表中查看。</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowArchiveDialog(false);
              if (studentId) {
                const success = isArchived 
                  ? await unarchiveStudent(studentId) 
                  : await archiveStudent(studentId);
                if (success) {
                  toast({
                    title: isArchived ? "已解除封存" : "已封存",
                    description: isArchived 
                      ? `學員「${name}」已解除封存` 
                      : `學員「${name}」已封存`,
                  });
                  navigate("/students");
                }
              }
            }}>
              {isArchived ? "確認解除封存" : "確認封存"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default StudentForm;
