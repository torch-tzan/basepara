import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, X, Calendar, FileText, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, Pencil, Archive } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import AddStudentDialog from "@/components/students/AddStudentDialog";
import CsvUploadDialog from "@/components/students/CsvUploadDialog";
import CoachDataError, { CoachSection } from "@/components/students/CoachDataError";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { calculateAge } from "@/lib/utils";

// Student Profile Component - matches StudentDetail layout
const StudentProfile = () => {
  const { authUser } = useAuth();
  const { students, isLoading } = useStudents();
  const { getTeamById } = useTeams();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  // For students, we'd need to link authUser.id to a student - for now use first student matching email
  const profile = students.find(s => s.email === authUser?.email) || null;
  const teamAttribute = profile ? getTeamById(profile.teamId)?.attribute : undefined;
  
  if (!profile) {
    return (
      <AppLayout title="個人資料">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">找不到學員資料</p>
        </div>
      </AppLayout>
    );
  }
  
  // Mobile layout - uses MobileStudentProfile style
  if (isMobile) {
    return (
      <AppLayout title="個人資料">
        <div className="space-y-4">
          {/* Main Info Card */}
          <Card>
            <CardContent className="p-4">
              {/* Student Info - matching desktop layout */}
              <div className="space-y-4">
                {/* Row 1 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">姓名</p>
                    <p className="text-base font-medium">{profile.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">所屬球隊</p>
                    <p className="text-base font-medium">{profile.teamName}</p>
                  </div>
                </div>

                {/* Row 2 - Attribute, Player Type & Position */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">屬性</p>
                    <p className="text-base font-medium">{teamAttribute || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">投/野</p>
                    <p className="text-base font-medium">{profile.playerType || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">位置</p>
                    <p className="text-base font-medium">{profile.position || "-"}</p>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">身高</p>
                    <p className="text-base font-medium">{profile.height ? `${profile.height} cm` : "-"}</p>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">體重</p>
                    <p className="text-base font-medium">{profile.weight ? `${profile.weight} kg` : "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">投球慣用手</p>
                    <p className="text-base font-medium">{profile.throwingHand || "-"}</p>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">打擊慣用手</p>
                    <p className="text-base font-medium">{profile.battingHand || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">生日</p>
                    <p className="text-base font-medium">{profile.birthday || "-"}</p>
                  </div>
                </div>

                {/* Row 5 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-base font-medium break-all">{profile.email || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">最後檢測</p>
                    <p className="text-base font-medium">{profile.lastTest || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Coaches Section */}
              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <CoachDataError className="mb-2" />
                <CoachSection
                  label="球隊教練"
                  coaches={profile.teamCoaches}
                  variant="secondary"
                  isLoading={isLoading}
                />
                <CoachSection
                  label="負責教練"
                  coaches={profile.responsibleCoaches}
                  variant="outline"
                  isLoading={isLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Desktop layout - matches StudentDetail exactly
  return (
    <AppLayout title="個人資料">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">姓名</p>
                  <p className="text-base font-medium">{profile.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">所屬球隊</p>
                  <p className="text-base font-medium">{profile.teamName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">屬性</p>
                  <p className="text-base font-medium">{teamAttribute || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">位置</p>
                  <p className="text-base font-medium">{profile.position || "-"}</p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">身高</p>
                  <p className="text-base font-medium">{profile.height ? `${profile.height} cm` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">體重</p>
                  <p className="text-base font-medium">{profile.weight ? `${profile.weight} kg` : "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">投球慣用手</p>
                  <p className="text-base font-medium">{profile.throwingHand || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">打擊慣用手</p>
                  <p className="text-base font-medium">{profile.battingHand || "-"}</p>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">生日</p>
                  <p className="text-base font-medium">{profile.birthday || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-base font-medium break-all">{profile.email || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">最後檢測</p>
                  <p className="text-base font-medium">{profile.lastTest || "-"}</p>
                </div>
              </div>
            </div>

            {/* Coaches Section */}
            <div className="mt-6 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
              <CoachDataError className="col-span-full mb-2" />
              <CoachSection
                label="球隊教練"
                coaches={profile.teamCoaches}
                variant="secondary"
                isLoading={isLoading}
              />
              <CoachSection
                label="負責教練"
                coaches={profile.responsibleCoaches}
                variant="outline"
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

// Archived Students Tab Component
const ArchivedStudentsTab = () => {
  const navigate = useNavigate();
  const { archivedStudents } = useStudents();
  const { teams } = useTeams();

  const tableStudents = useMemo(() => 
    archivedStudents.map(s => ({
      id: s.id,
      name: s.name,
      team: s.teamName,
      teamAttribute: teams.find(t => t.id === s.teamId)?.attribute || "",
      playerType: s.playerType || "-",
      position: s.position,
      age: calculateAge(s.birthday),
    })),
    [archivedStudents, teams]
  );

  if (tableStudents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Archive className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">目前沒有已封存的學員</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">已封存學員列表</CardTitle>
        <span className="text-sm text-muted-foreground">共 {tableStudents.length} 名學員</span>
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
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableStudents.map((student) => (
              <TableRow 
                key={student.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <TableCell><span className="font-medium">{student.name}</span></TableCell>
                <TableCell>{student.team}</TableCell>
                <TableCell className="text-muted-foreground">{student.teamAttribute || "-"}</TableCell>
                <TableCell>{student.playerType}</TableCell>
                <TableCell>{student.position || "-"}</TableCell>
                <TableCell>{student.age ?? "-"}</TableCell>
                <TableCell>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Coach Students List Component
const CoachStudentsList = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const { teams } = useTeams();
  const { 
    filteredStudents, 
    filteredTeamOptions, 
    filteredCoachOptions,
    hasFullSiteAccess 
  } = useDataAccess("students");
  const canEdit = permissions.students.canEdit;
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilterValue, setTeamFilterValue] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [coachFilter, setCoachFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  
  // Sorting state
  type SortField = "name" | "team" | "position" | null;
  type SortDirection = "asc" | "desc" | null;
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 text-muted-foreground/50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />;
  };

  // Transform students for table display - use permission-filtered data
  const tableStudents = useMemo(() => 
    filteredStudents.map(s => ({
      id: s.id,
      name: s.name,
      team: s.teamName,
      teamId: s.teamId,
      teamAttribute: teams.find(t => t.id === s.teamId)?.attribute || "",
      playerType: s.playerType || "-",
      position: s.position,
      age: calculateAge(s.birthday),
      height: `${s.height}cm / ${s.weight}kg`,
      lastTest: s.lastTest,
      lastTraining: s.lastTraining,
      teamCoaches: s.teamCoaches,
      responsibleCoaches: s.responsibleCoaches,
    })),
    [filteredStudents, teams]
  );

  // Get unique positions from filtered students
  const positionOptions = useMemo(() => {
    const positions = [...new Set(filteredStudents.map(s => s.position).filter(Boolean))];
    return [{ value: "all", label: "所有位置" }, ...positions.map(p => ({ value: p, label: p }))];
  }, [filteredStudents]);

  // Check if any filter is active
  const hasActiveFilters = teamFilterValue || positionFilter || coachFilter;

  // Clear all filters
  const handleClearFilters = () => {
    setTeamFilterValue("");
    setPositionFilter("");
    setCoachFilter("");
  };

  // Filter students from already permission-filtered data
  const displayFilteredStudents = useMemo(() => {
    let filtered = tableStudents;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(query));
    }

    // Team filter
    if (teamFilterValue && teamFilterValue !== "all") {
      filtered = filtered.filter(s => s.teamId === teamFilterValue);
    }

    // Position filter
    if (positionFilter && positionFilter !== "all") {
      filtered = filtered.filter(s => s.position === positionFilter);
    }

    // Coach filter
    if (coachFilter && coachFilter !== "all") {
      const coachName = filteredCoachOptions.find(c => c.value === coachFilter)?.label;
      filtered = filtered.filter(s => 
        s.teamCoaches.includes(coachName || "") || 
        s.responsibleCoaches.includes(coachName || "")
      );
    }

    // Sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue = "";
        let bValue = "";
        
        if (sortField === "name") {
          aValue = a.name;
          bValue = b.name;
        } else if (sortField === "team") {
          aValue = a.team;
          bValue = b.team;
        } else if (sortField === "position") {
          aValue = a.position || "";
          bValue = b.position || "";
        }
        
        const comparison = aValue.localeCompare(bValue, "zh-TW");
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [tableStudents, searchQuery, teamFilterValue, positionFilter, coachFilter, filteredCoachOptions, sortField, sortDirection]);

  // Pagination calculations
  const totalItems = displayFilteredStudents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const displayStudents = displayFilteredStudents.slice(startIndex, endIndex);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleViewSchedule = (studentId: string) => {
    if (!permissions.schedule.canView) {
      toast({
        variant: "destructive",
        title: "權限不足",
        description: "您的角色沒有「課表管理」的檢視權限",
      });
      return;
    }
    navigate(`/schedule?student=${studentId}`);
  };

  const handleViewReports = (studentId: string) => {
    if (!permissions.reports.canView) {
      toast({
        variant: "destructive",
        title: "權限不足",
        description: "您的角色沒有「檢測報告」的檢視權限",
      });
      return;
    }
    navigate(`/reports?student=${studentId}`);
  };

  return (
    <AppLayout
      title="學員資料管理"
      headerAction={
        canEdit ? (
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            新增學員
          </Button>
        ) : undefined
      }
    >
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">啟用中</TabsTrigger>
          <TabsTrigger value="archived">已封存</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
        {/* Filter Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">學員資料篩選</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar - 50% width, own row */}
            <div className="relative w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋學員姓名..."
                defaultValue={searchQuery}
                onValueChange={setSearchQuery}
                className="pl-10"
              />
            </div>
            
            {/* Filter dropdowns and clear button */}
            <div className="flex items-center gap-4">
              {/* Team filter - 25% width */}
              <div className="w-1/4">
                <Select value={teamFilterValue} onValueChange={setTeamFilterValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="所有學校" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeamOptions.map((team) => (
                      <SelectItem key={team.value} value={team.value}>
                        {team.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Position filter - 25% width */}
              <div className="w-1/4">
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="所有位置" />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Coach filter - 25% width */}
              <div className="w-1/4">
                <Select value={coachFilter} onValueChange={setCoachFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="所有教練" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCoachOptions.map((coach) => (
                      <SelectItem key={coach.value} value={coach.value}>
                        {coach.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear button - 25% width, only show when filters active */}
              <div className="w-1/4">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-muted-foreground hover:text-foreground w-full justify-start"
                    onClick={handleClearFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    清除篩選
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">
              {hasFullSiteAccess ? "全部球隊學員列表" : "負責球隊學員列表"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">共 {totalItems} 名學員</span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      學員姓名
                      {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("team")}
                  >
                    <div className="flex items-center">
                      所屬球隊
                      {getSortIcon("team")}
                    </div>
                  </TableHead>
                  <TableHead>屬性</TableHead>
                  <TableHead>投/野</TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort("position")}
                  >
                    <div className="flex items-center">
                      位置
                      {getSortIcon("position")}
                    </div>
                  </TableHead>
                  <TableHead>年齡</TableHead>
                  <TableHead>負責教練</TableHead>
                  <TableHead>最後檢測</TableHead>
                  <TableHead>最後訓練</TableHead>
                  <TableHead className="text-center">快速操作</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayStudents.map((student) => (
                  <TableRow 
                    key={student.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <TableCell>
                      <span className="font-medium">{student.name}</span>
                    </TableCell>
                    <TableCell>{student.team}</TableCell>
                    <TableCell className="text-muted-foreground">{student.teamAttribute || "-"}</TableCell>
                    <TableCell>{student.playerType}</TableCell>
                    <TableCell>{student.position || "-"}</TableCell>
                    <TableCell>{student.age ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.responsibleCoaches.slice(0, 3).map((coach, idx) => (
                          <Badge key={idx} variant="outline" className="font-normal text-xs">
                            {coach}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{student.lastTest}</TableCell>
                    <TableCell>{student.lastTraining}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canEdit && (
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
                          onClick={() => handleViewSchedule(student.id)}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          title="查看檢測報告"
                          onClick={() => handleViewReports(student.id)}
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
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <TablePagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="archived">
          <ArchivedStudentsTab />
        </TabsContent>
      </Tabs>

      <AddStudentDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onSelectManual={() => navigate("/students/add")}
        onSelectCsv={() => setCsvDialogOpen(true)}
      />
      <CsvUploadDialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen} />
    </AppLayout>
  );
};

const Students = () => {
  const { authUser } = useAuth();
  const isStudent = authUser?.role === "student";

  if (isStudent) {
    return <StudentProfile />;
  }

  return <CoachStudentsList />;
};

export default Students;
