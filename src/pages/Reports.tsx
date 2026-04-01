import { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X, Download, Circle, CalendarIcon, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDataAccess, useFilteredStudentsByTeam } from "@/hooks/useDataAccess";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { getTestTypeColor } from "@/data/trainingTemplates";
import { TablePagination } from "@/components/ui/table-pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileReportsList from "@/components/reports/MobileReportsList";
import MobileReportsFilter from "@/components/reports/MobileReportsFilter";
import { StudentSearchSelect } from "@/components/ui/student-search-select";

const Reports = () => {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { permissions } = usePermissions();
  const isMobile = useIsMobile();
  const { students } = useStudents();
  const { teams } = useTeams();
  const { 
    filteredReports, 
    filteredTeamOptions, 
    filteredStudents,
    accessibleStudentIds,
    hasFullSiteAccess 
  } = useDataAccess("reports");
  const [searchParams] = useSearchParams();
  const isStudent = authUser?.role === "student";
  const isTeamCoach = authUser?.role === "team_coach";
  const isVenueCoach = authUser?.role === "venue_coach" || authUser?.role === "admin";

  
  // Helper to get student by ID from context
  const getStudentById = (id: string) => students.find((s) => s.id === id);
  
  // Date range state - default to undefined (no filter)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Test type filter
  const [testType, setTestType] = useState("all");
  
  // Initialize student from URL params
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    const studentIdParam = new URLSearchParams(window.location.search).get("student");
    if (studentIdParam) {
      const student = students.find((s) => s.id === studentIdParam);
      if (student) {
        return studentIdParam;
      }
    }
    return "";
  });

  // Searchable students list filtered by permissions
  const searchableStudents = useMemo(() => {
    return filteredStudents
      .filter((s) => accessibleStudentIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        teamName: s.teamName,
      }));
  }, [filteredStudents, accessibleStudentIds]);

  // Check if date range is set
  const hasDateFilter = dateRange?.from !== undefined || dateRange?.to !== undefined;

  // Check if any non-date filter is active
  const hasActiveFilters = useMemo(() => {
    return selectedStudentId !== "" || testType !== "all";
  }, [selectedStudentId, testType]);

  // Transform and filter reports based on role and permission-based data
  const transformedReportsData = useMemo(() => {
    // Start with permission-filtered reports (based on fullSite flag)
    return filteredReports.map(r => ({
      id: r.id,
      date: r.date,
      team: r.teamName,
      player: r.studentName,
      type: r.type,
      studentId: r.studentId,
      teamId: r.teamId,
    }));
  }, [filteredReports]);

  // Filter reports based on UI selections and date range
  const reportsData = useMemo(() => {
    let baseData = transformedReportsData;
    
    // Student only sees their own reports - filter by accessible student IDs
    if (isStudent && accessibleStudentIds.length > 0) {
      baseData = baseData.filter(r => accessibleStudentIds.includes(r.studentId));
    }
    
    // If a specific student is selected, filter by that student
    if (selectedStudentId && selectedStudentId !== "" && !isStudent) {
      baseData = baseData.filter(r => r.studentId === selectedStudentId);
    }
    
    // Filter by test type
    if (testType !== "all") {
      baseData = baseData.filter(r => r.type === testType);
    }
    
    // Filter by date range
    if (dateRange?.from || dateRange?.to) {
      baseData = baseData.filter(r => {
        const reportDate = new Date(r.date);
        // Reset time to midnight for accurate date comparison
        reportDate.setHours(0, 0, 0, 0);
        
        if (dateRange.from && dateRange.to) {
          const fromDate = new Date(dateRange.from);
          const toDate = new Date(dateRange.to);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(23, 59, 59, 999);
          return reportDate >= fromDate && reportDate <= toDate;
        } else if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          return reportDate >= fromDate;
        } else if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          return reportDate <= toDate;
        }
        return true;
      });
    }
    
    return baseData;
  }, [transformedReportsData, isStudent, accessibleStudentIds, selectedStudentId, testType, dateRange]);

  // Pagination calculations
  const totalItems = reportsData.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const displayReports = reportsData.slice(startIndex, endIndex);

  // Get players for team coach (filter by their teams - permission aware)
  const teamPlayerOptions = useMemo(() => {
    // Filter students based on accessible IDs (permission-based)
    return filteredStudents
      .filter(s => accessibleStudentIds.includes(s.id))
      .map(s => ({ value: s.id, label: s.name }));
  }, [accessibleStudentIds, filteredStudents]);

  // Handle student change
  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setCurrentPage(1);
  };

  // Handle test type change
  const handleTestTypeChange = (value: string) => {
    setTestType(value);
    setCurrentPage(1);
  };

  // Handle date range change
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  // Clear date range filter
  const handleClearDateRange = () => {
    setDateRange(undefined);
    setCurrentPage(1);
  };

  // Clear non-date filters (test type, student)
  const handleClearFilters = () => {
    setSelectedStudentId("");
    setTestType("all");
    setCurrentPage(1);
  };

  return (
    <AppLayout
      title="檢測報告"
      headerAction={
        <Button asChild>
          <Link to="/reports/new">
            <Plus className="w-4 h-4 mr-2" />
            新增報告
          </Link>
        </Button>
      }
    >
      <div className="space-y-4 md:space-y-6">
      {/* Mobile Filter - Student only sees test type pills */}
      {isMobile && (
        <MobileReportsFilter
          testType={testType}
          onTestTypeChange={handleTestTypeChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          hasActiveFilters={hasActiveFilters || hasDateFilter}
          onClearFilters={() => {
            handleClearFilters();
            handleClearDateRange();
          }}
          isStudent={isStudent}
          searchableStudents={searchableStudents}
          selectedStudentId={selectedStudentId}
          onStudentChange={handleStudentChange}
        />
      )}

      {/* Desktop Filter Section - Coach (Venue or Team coach with limited access) */}
      {!isStudent && !isMobile && (
        <section className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-medium text-foreground mb-4">篩選條件</h3>
          <div className="space-y-4">
            {/* Date Range Picker - 50% width, own row */}
            <div className="flex items-center gap-4">
              <div className="w-1/2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "yyyy/MM/dd")} - {format(dateRange.to, "yyyy/MM/dd")}
                            </>
                          ) : (
                            format(dateRange.from, "yyyy/MM/dd")
                          )
                        ) : (
                          <span>選擇日期範圍</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from || new Date()}
                        selected={dateRange}
                        onSelect={handleDateRangeChange}
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Clear date range button */}
                {hasDateFilter && (
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-muted-foreground hover:text-foreground"
                    onClick={handleClearDateRange}
                  >
                    <X className="w-4 h-4 mr-2" />
                    清除起迄日
                  </Button>
                )}
              </div>

              {/* Other filters row */}
              <div className="flex items-center gap-4">
                {/* Test Type - 25% width */}
                <div className="w-1/4">
                  <Select value={testType} onValueChange={handleTestTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="全部項目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部項目</SelectItem>
                      <SelectItem value="投球">投球</SelectItem>
                      <SelectItem value="打擊">打擊</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Student Search - 50% width */}
                <div className="w-1/2">
                  <StudentSearchSelect
                    students={searchableStudents}
                    value={selectedStudentId}
                    onChange={handleStudentChange}
                    placeholder="搜尋學員..."
                    allowAllStudents={true}
                    className="w-full"
                  />
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
            </div>
          </section>
        )}

        {/* Info header for student only */}
        {isStudent && !isMobile && (
          <div className="text-sm text-muted-foreground">
            正在檢視：<span className="text-foreground font-medium">{authUser?.name}</span>
          </div>
        )}

        {/* Mobile Reports List */}
        {isMobile && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                共找到 {totalItems} 份報告
              </p>
            </div>
            <MobileReportsList
              reports={displayReports}
              isStudent={isStudent}
              onReportClick={(id) => navigate(`/reports/${id}`)}
            />
            {/* Mobile Pagination - simple load more or minimal */}
            {totalItems > itemsPerPage && (
              <div className="mt-4 flex justify-center">
                <TablePagination
                  currentPage={currentPage}
                  totalItems={reportsData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                  standalone
                />
              </div>
            )}
          </section>
        )}

        {/* Desktop Reports List */}
        {!isMobile && (
        <section className="bg-card rounded-lg border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="text-lg font-medium text-foreground">檢測報告列表</h3>
            <p className="text-sm text-muted-foreground mt-1">
              共找到 {totalItems} 份報告
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>報告日期</TableHead>
                {!isStudent && <TableHead>學校</TableHead>}
                {!isStudent && <TableHead>選手</TableHead>}
                <TableHead>檢測項目</TableHead>
                <TableHead className="text-center">下載</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayReports.map((report, idx) => (
                <TableRow
                  key={idx}
                  className="cursor-pointer"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <TableCell className="text-foreground">{report.date}</TableCell>
                  {!isStudent && (
                    <TableCell className="text-foreground">
                      {report.team}
                    </TableCell>
                  )}
                  {!isStudent && (
                    <TableCell className="text-foreground">
                      {report.player}
                    </TableCell>
                  )}
                  <TableCell>
                    {(() => {
                      const typeColor = getTestTypeColor(report.type);
                      return (
                        <Badge 
                          className={cn(
                            "flex items-center gap-1.5 w-fit border-0",
                            typeColor.bg,
                            typeColor.text,
                            `hover:${typeColor.bg}`
                          )}
                        >
                          <Circle className={cn("w-2 h-2", typeColor.dot)} />
                          {report.type}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); }}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalItems={reportsData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </section>
        )}
      </div>
    </AppLayout>
  );
};

export default Reports;
