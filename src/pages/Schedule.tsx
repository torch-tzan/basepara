import { useState, DragEvent, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Download,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GripVertical,
  X,
  PanelLeftClose,
  PanelLeft,
  Edit,
  Undo2,
  Redo2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useDataAccess } from "@/hooks/useDataAccess";
import { TabNav, TabNavItem } from "@/components/ui/tab-nav";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import MobileScheduleCalendar from "@/components/schedule/MobileScheduleCalendar";
import MobileCoachSchedule from "@/components/schedule/MobileCoachSchedule";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStudents } from "@/contexts/StudentsContext";
import { useTeams } from "@/contexts/TeamsContext";
import { 
  useScheduleEventsByMonth, 
  useBulkUpdateScheduleEvents,
  type ScheduleEventWithDetails 
} from "@/hooks/useSupabaseSchedule";

const weekDays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

// Calendar event type for local use
interface CalendarEvent {
  id?: string; // DB event id for updates/deletes
  courseId: string;
  name: string;
  studentId: string;
  studentName: string;
  team: string;
  highlight?: boolean;
  courseType?: "public" | "personal";
}

type CalendarEventsType = Record<number, CalendarEvent[]>;

// Transform Supabase events to CalendarEvents
const transformSupabaseEvents = (events: Record<number, ScheduleEventWithDetails[]>): CalendarEventsType => {
  return Object.fromEntries(
    Object.entries(events).map(([day, evts]) => [
      parseInt(day, 10),
      evts.map(e => ({
        id: e.id,
        courseId: e.courseId,
        name: e.courseName,
        studentId: e.studentId,
        studentName: e.studentName,
        team: e.teamName,
        highlight: e.highlight,
        courseType: e.courseType,
      }))
    ])
  );
};

const Schedule = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { permissions } = usePermissions();
  const { filteredTeams, filteredStudents, accessibleStudentIds } = useDataAccess("schedule");
  const { courses, getCourseById, personalCourses, getPersonalCourseById } = useTrainingData();
  const { students: studentsFromContext } = useStudents();
  const { teams: teamsFromContext } = useTeams();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const isStudent = authUser?.role === "student";
  const isTeamCoach = authUser?.role === "team_coach";
  const canEdit = permissions.schedule.canEdit;

  // Transform students for local use
  const studentsData = useMemo(() => 
    studentsFromContext.map(s => ({
      id: s.id,
      name: s.name,
      team: s.teamName,
      teamKey: s.teamId,
    })), 
    [studentsFromContext]
  );

  // Calendar year/month state - 優先從 sessionStorage 恢復，其次從 URL，最後用當前日期
  const [currentYear, setCurrentYear] = useState(() => {
    const yearParam = searchParams.get("year");
    if (yearParam) return parseInt(yearParam, 10);
    const savedYear = sessionStorage.getItem("scheduleYear");
    if (savedYear) return parseInt(savedYear, 10);
    return new Date().getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const monthParam = searchParams.get("month");
    if (monthParam) return parseInt(monthParam, 10);
    const savedMonth = sessionStorage.getItem("scheduleMonth");
    if (savedMonth) return parseInt(savedMonth, 10);
    return new Date().getMonth() + 1;
  });

  // Fetch schedule events from Supabase
  const { data: supabaseEvents, isLoading: eventsLoading } = useScheduleEventsByMonth(currentYear, currentMonth);
  const bulkUpdateMutation = useBulkUpdateScheduleEvents();

  const [activeTab, setActiveTab] = useState<"public" | "personal">("public");
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventsType>({});
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<{ day: number; eventIdx: number; event: CalendarEvent } | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [history, setHistory] = useState<CalendarEventsType[]>([{}]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Filters - 優先從 URL 參數恢復，其次從 sessionStorage
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    // 優先檢查 URL 參數（從其他頁面跳轉過來時使用）
    const studentIdParam = new URLSearchParams(window.location.search).get("student");
    if (studentIdParam) {
      return studentIdParam;
    }
    // 其次從 sessionStorage 恢復（從課程詳情頁返回時使用）
    const savedStudentId = sessionStorage.getItem("scheduleSelectedStudent");
    if (savedStudentId) {
      return savedStudentId;
    }
    return "";
  });

  // Sync Supabase data to local state when in view mode
  useEffect(() => {
    if (supabaseEvents && mode === "view") {
      const transformed = transformSupabaseEvents(supabaseEvents);
      setCalendarEvents(transformed);
      setLastSavedEvents(transformed);
      setHistory([transformed]);
      setHistoryIndex(0);
    }
  }, [supabaseEvents, mode]);

  // Get training templates based on active tab - use real data from context
  const trainingTemplates = useMemo(() => {
    const sourceData = activeTab === "public" ? courses : personalCourses;
    const categoryMap = new Map<string, { id: string; name: string; courseType: "public" | "personal" }[]>();
    
    sourceData.forEach((course) => {
      const items = categoryMap.get(course.category) || [];
      items.push({ 
        id: course.id, 
        name: course.name, 
        courseType: activeTab === "public" ? "public" : "personal" 
      });
      categoryMap.set(course.category, items);
    });
    
    return Array.from(categoryMap.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [activeTab, courses, personalCourses]);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    trainingTemplates.forEach((cat) => {
      initial[cat.category] = true;
    });
    return initial;
  });

  // Students filtered by permissions for the search component
  const searchableStudents = useMemo(() => {
    return studentsData
      .filter((s) => accessibleStudentIds.includes(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        teamName: s.team,
      }));
  }, [accessibleStudentIds, studentsData]);

  // Get selected student info for edit mode
  const selectedStudentInfo = useMemo(() => {
    if (!selectedStudentId || selectedStudentId === "") return null;
    return studentsData.find((s) => s.id === selectedStudentId) || null;
  }, [selectedStudentId, studentsData]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Auto-save status
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedEvents, setLastSavedEvents] = useState<CalendarEventsType>({});

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(calendarEvents) !== JSON.stringify(lastSavedEvents);

  // Update events with history tracking
  const updateEventsWithHistory = (newEvents: CalendarEventsType) => {
    // Truncate future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEvents);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCalendarEvents(newEvents);
  };

  // Undo action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCalendarEvents(history[newIndex]);
    }
  };

  // Redo action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCalendarEvents(history[newIndex]);
    }
  };

  // Calculate changes for saving to Supabase
  const calculateChanges = useCallback(() => {
    const toAdd: { date: string; course_id: string; student_id: string; course_type?: "public" | "personal"; highlight?: boolean }[] = [];
    const toDelete: string[] = [];

    // Find events to delete (in lastSavedEvents but not in calendarEvents)
    Object.entries(lastSavedEvents).forEach(([day, events]) => {
      events.forEach(event => {
        if (event.id) {
          const dayNum = parseInt(day);
          const currentDayEvents = calendarEvents[dayNum] || [];
          const stillExists = currentDayEvents.some(e => e.id === event.id);
          if (!stillExists) {
            toDelete.push(event.id);
          }
        }
      });
    });

    // Find events to add (in calendarEvents but no id = new events)
    Object.entries(calendarEvents).forEach(([day, events]) => {
      const dayNum = parseInt(day);
      events.forEach(event => {
        if (!event.id) {
          const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          toAdd.push({
            date: dateStr,
            course_id: event.courseId,
            student_id: event.studentId,
            course_type: event.courseType || "public",
            highlight: event.highlight,
          });
        }
      });
    });

    return { add: toAdd, delete: toDelete };
  }, [calendarEvents, lastSavedEvents, currentYear, currentMonth]);

  // Save to Supabase
  const saveToSupabase = useCallback(async () => {
    const changes = calculateChanges();
    if (changes.add.length === 0 && changes.delete.length === 0) {
      return true;
    }

    try {
      await bulkUpdateMutation.mutateAsync(changes);
      return true;
    } catch (error) {
      console.error("Failed to save schedule:", error);
      toast({
        title: "儲存失敗",
        description: "無法儲存課表變更，請稍後再試",
        variant: "destructive",
      });
      return false;
    }
  }, [calculateChanges, bulkUpdateMutation, toast]);

  // Auto-save effect with Supabase
  useEffect(() => {
    if (mode !== "edit" || !hasUnsavedChanges) return;

    const saveTimeout = setTimeout(async () => {
      setIsSaving(true);
      const success = await saveToSupabase();
      if (success) {
        setLastSavedEvents(calendarEvents);
      }
      setIsSaving(false);
    }, 1500); // Debounce 1.5 seconds

    return () => clearTimeout(saveTimeout);
  }, [calendarEvents, mode, hasUnsavedChanges, saveToSupabase]);

  // Complete editing and return to view mode
  const handleComplete = useCallback(async () => {
    if (mode !== "edit") return;
    
    if (hasUnsavedChanges) {
      setIsSaving(true);
      const success = await saveToSupabase();
      if (success) {
        setLastSavedEvents(calendarEvents);
        toast({
          title: "已儲存",
          description: "課表變更已儲存",
        });
      }
      setIsSaving(false);
    }
    setMode("view");
    setPanelCollapsed(true);
  }, [mode, hasUnsavedChanges, calendarEvents, toast, saveToSupabase]);

  // Keyboard shortcut: Cmd/Ctrl + S to save immediately
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (mode === "edit" && hasUnsavedChanges) {
          setIsSaving(true);
          const success = await saveToSupabase();
          if (success) {
            setLastSavedEvents(calendarEvents);
            toast({
              title: "已儲存",
              description: "課表變更已儲存",
            });
          }
          setIsSaving(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, hasUnsavedChanges, calendarEvents, toast, saveToSupabase]);

  // Check if can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Enter edit mode for specific student
  const handleEnterEditMode = () => {
    if (selectedStudentId && selectedStudentId !== "") {
      setMode("edit");
      setPanelCollapsed(false);
      // Reset history for new edit session
      setHistory([calendarEvents]);
      setHistoryIndex(0);
    }
  };

  // Handle student selection change
  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    if (mode === "edit" && value === "") {
      // Can't select "all" in edit mode, stay with current selection
      // Do nothing - keep current selection
    }
  };

  // Month names for display
  const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  // Year options (current year ± 2 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => 2024 + i);

  // Track previous year/month - now handled by useScheduleEventsByMonth hook
  // The data is fetched automatically when year/month changes

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar days dynamically based on year and month
  const generateCalendarDays = useMemo(() => {
    // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // Get the number of days in the previous month
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
    
    const days: { day: number; isCurrentMonth: boolean }[] = [];
    
    // Add previous month's days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    // Add next month's days to complete the grid (up to 6 weeks)
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({ day: nextMonthDay++, isCurrentMonth: false });
    }
    
    return days;
  }, [currentYear, currentMonth]);

  const allDays = generateCalendarDays;

  // Filter events based on mode and selection
  const getFilteredEvents = (day: number) => {
    const events = calendarEvents[day] || [];
    
    // Students only see their own events - use first accessible student ID
    if (isStudent && accessibleStudentIds.length > 0) {
      return events.filter((e) => e.studentId === accessibleStudentIds[0]);
    }
    
    if (mode === "view") {
      // Filter by student selection AND permission
      return events.filter((e) => {
        // First check: must be within user's accessible students (permission-based)
        if (accessibleStudentIds.length > 0 && !accessibleStudentIds.includes(e.studentId)) {
          return false;
        }
        
        // Then apply user's filter selection
        if (selectedStudentId && selectedStudentId !== "") {
          return e.studentId === selectedStudentId;
        }
        // No filter = show all accessible students
        return true;
      });
    } else {
      // Edit mode: only show selected student's events
      return events.filter((e) => e.studentId === selectedStudentId);
    }
  };

  // Drag handlers (only work in edit mode)
  const handleDragStart = (e: DragEvent<HTMLDivElement>, itemName: string, courseId?: string) => {
    if (mode !== "edit") return;
    e.dataTransfer.setData("text/plain", itemName);
    if (courseId) {
      e.dataTransfer.setData("courseId", courseId);
    }
    e.dataTransfer.effectAllowed = "move";
  };
  
  // 日曆內事件拖曳開始
  const handleCalendarEventDragStart = (
    e: DragEvent<HTMLDivElement>, 
    day: number, 
    eventIdx: number, 
    event: CalendarEvent
  ) => {
    if (mode !== "edit") return;
    e.dataTransfer.setData("text/plain", event.name);
    e.dataTransfer.setData("courseId", event.courseId);
    e.dataTransfer.setData("fromDay", String(day));
    e.dataTransfer.setData("eventIdx", String(eventIdx));
    e.dataTransfer.effectAllowed = "move";
    setDraggingEvent({ day, eventIdx, event });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, day: number, isCurrentMonth: boolean) => {
    if (mode !== "edit") return;
    e.preventDefault();
    if (isCurrentMonth) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };
  
  const handleDragEnd = () => {
    setDraggingEvent(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, day: number, isCurrentMonth: boolean) => {
    e.preventDefault();
    setDragOverDay(null);
    
    if (mode !== "edit" || !isCurrentMonth || !selectedStudentInfo) return;
    
    const itemName = e.dataTransfer.getData("text/plain");
    const courseId = e.dataTransfer.getData("courseId");
    const fromDay = e.dataTransfer.getData("fromDay");
    const eventIdx = e.dataTransfer.getData("eventIdx");
    
    if (!itemName) return;
    
    let newEvents = { ...calendarEvents };
    
    // 如果是從日曆內拖曳（移動事件）
    if (fromDay && eventIdx) {
      const fromDayNum = parseInt(fromDay);
      const eventIdxNum = parseInt(eventIdx);
      
      // 如果目標日期和來源日期相同，不做任何事
      if (fromDayNum === day) {
        setDraggingEvent(null);
        return;
      }
      
      // 從來源日期移除事件
      const sourceEvents = newEvents[fromDayNum] || [];
      const filteredSource = getFilteredEvents(fromDayNum);
      const eventToMove = filteredSource[eventIdxNum];
      
      if (eventToMove) {
        const actualIdx = sourceEvents.findIndex(
          (e) => e.courseId === eventToMove.courseId && e.studentId === eventToMove.studentId
        );
        
        if (actualIdx !== -1) {
          const movedEvent = sourceEvents[actualIdx];
          const updatedSource = sourceEvents.filter((_, idx) => idx !== actualIdx);
          
          if (updatedSource.length === 0) {
            delete newEvents[fromDayNum];
          } else {
            newEvents[fromDayNum] = updatedSource;
          }
          
          // 新增到目標日期
          const targetEvents = newEvents[day] || [];
          newEvents[day] = [...targetEvents, movedEvent];
        }
      }
      
      setDraggingEvent(null);
    } else {
      // 從側邊欄拖曳新項目
      // 獲取課程類型和 ID
      const courseType = (e.dataTransfer.getData("courseType") || "public") as "public" | "personal";
      const course = courseType === "public" 
        ? courses.find(c => c.name === itemName)
        : personalCourses.find(c => c.name === itemName);
      const finalCourseId = courseId || course?.id || `temp-${Date.now()}`;
      const isHighlight = itemName.includes("模擬") || itemName.includes("牛棚");

      const existing = newEvents[day] || [];
      newEvents[day] = [...existing, { 
        courseId: finalCourseId,
        name: itemName, 
        studentId: selectedStudentInfo.id,
        studentName: selectedStudentInfo.name,
        team: selectedStudentInfo.team,
        highlight: isHighlight,
        courseType: courseType,
      }];
    }
    
    updateEventsWithHistory(newEvents);
  };

  // 點擊課程導航到詳情頁
  const handleEventClick = (event: CalendarEvent) => {
    // 保存當前篩選狀態到 sessionStorage
    if (selectedStudentId) {
      sessionStorage.setItem("scheduleSelectedStudent", selectedStudentId);
    }
    // 同時保存年月
    sessionStorage.setItem("scheduleYear", String(currentYear));
    sessionStorage.setItem("scheduleMonth", String(currentMonth));
    
    // Try public courses first, then personal
    const publicCourse = getCourseById(event.courseId);
    if (publicCourse) {
      navigate(`/schedule/course/${publicCourse.id}`);
      return;
    }
    
    const personalCourse = getPersonalCourseById(event.courseId);
    if (personalCourse) {
      // Personal courses use the same course detail page
      navigate(`/schedule/course/${personalCourse.id}?type=personal`);
      return;
    }
    
    toast({
      title: "無法顯示課程詳情",
      description: "找不到此課程的詳細資料",
      variant: "destructive",
    });
  };

  const handleDeleteEvent = (day: number, eventIdx: number) => {
    if (mode !== "edit") return;
    
    const existing = calendarEvents[day] || [];
    // Find the actual index of the event in the full array
    const filteredEvents = getFilteredEvents(day);
    const eventToDelete = filteredEvents[eventIdx];
    const actualIdx = existing.findIndex(
      (e) => e.courseId === eventToDelete.courseId && e.studentId === eventToDelete.studentId
    );
    
    if (actualIdx === -1) return;
    
    const updated = existing.filter((_, idx) => idx !== actualIdx);
    let newEvents: CalendarEventsType;
    if (updated.length === 0) {
      newEvents = { ...calendarEvents };
      delete newEvents[day];
    } else {
      newEvents = { ...calendarEvents, [day]: updated };
    }
    updateEventsWithHistory(newEvents);
  };

  // Mobile student view - simplified calendar
  if (isMobile && isStudent && accessibleStudentIds.length > 0) {
    return (
      <AppLayout title="我的課表" noPadding>
        <MobileScheduleCalendar
          studentId={accessibleStudentIds[0]}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onYearChange={setCurrentYear}
          onMonthChange={setCurrentMonth}
        />
      </AppLayout>
    );
  }

  // Mobile coach view - optimized for mobile
  if (isMobile && !isStudent) {
    const teamsForMobile = filteredTeams.map(t => ({ id: t.id, name: t.name }));
    const studentsForMobile = studentsData.map(s => ({ id: s.id, name: s.name, teamKey: s.teamKey, teamName: s.team }));
    
    return (
      <AppLayout title="課表管理">
        <div className="space-y-4">
          <MobileCoachSchedule
            currentYear={currentYear}
            currentMonth={currentMonth}
            onYearChange={setCurrentYear}
            onMonthChange={setCurrentMonth}
            teams={teamsForMobile}
            students={studentsForMobile}
            accessibleStudentIds={accessibleStudentIds}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="課表管理"
      headerAction={
        <div className="flex items-center gap-3">
          {mode === "view" ? (
            <>
              {/* View Mode: Only show export button */}
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                匯出課表
              </Button>
            </>
          ) : (
            <>
              {/* Edit Mode: Status + Undo + Redo + Complete */}
              <div className="flex items-center gap-2 text-sm">
                {isSaving ? (
                  <span className="text-muted-foreground">儲存中...</span>
                ) : hasUnsavedChanges ? (
                  <span className="text-destructive">● 未儲存</span>
                ) : (
                  <span className="text-primary">✓ 已儲存</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="復原"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="重複"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
              <Button className="flex items-center gap-2" onClick={handleComplete}>
                完成
              </Button>
            </>
          )}
        </div>
      }
    >
      <div className="flex h-[calc(100vh-72px)] -m-8">
        {/* Left Panel - Training Templates (only visible in edit mode) */}
        {mode === "edit" && (
          <div
            className={`bg-card border-r border-border flex flex-col transition-all duration-300 ${
              panelCollapsed ? "w-12" : "w-80"
            }`}
          >
            {/* Panel Header */}
            <div className={`p-4 border-b border-border ${panelCollapsed ? "flex justify-center" : ""}`}>
              {panelCollapsed ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPanelCollapsed(false)}
                >
                  <PanelLeft className="w-4 h-4" />
                </Button>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-foreground">訓練項目</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPanelCollapsed(true)}
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="text" placeholder="搜尋範本..." className="pl-10" />
                  </div>

                  {/* Tabs */}
                  <TabNav className="border-b border-border">
                    <TabNavItem
                      active={activeTab === "public"}
                      variant="underline"
                      onClick={() => setActiveTab("public")}
                    >
                      公用範本
                    </TabNavItem>
                    <TabNavItem
                      active={activeTab === "personal"}
                      variant="underline"
                      onClick={() => setActiveTab("personal")}
                    >
                      個人範本
                    </TabNavItem>
                  </TabNav>
                </>
              )}
            </div>

            {/* Template Categories */}
            {!panelCollapsed && (
              <div className="flex-1 overflow-auto p-6">
                <div className="space-y-4">
                  {trainingTemplates.map((category) => {
                    const isExpanded = expandedCategories[category.category] ?? true;
                    return (
                      <div key={category.category}>
                        <button
                          onClick={() => toggleCategory(category.category)}
                          className="w-full flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide hover:text-foreground mb-2"
                        >
                          <span>{category.category}</span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform duration-200 ${
                              isExpanded ? "" : "-rotate-90"
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="space-y-2">
                            {category.items.map((item) => {
                              // 查找對應的課程 ID 和顏色
                              const course = activeTab === "public" 
                                ? courses.find(c => c.id === item.id)
                                : personalCourses.find(c => c.id === item.id);
                              return (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData("text/plain", item.name);
                                    e.dataTransfer.setData("courseId", item.id);
                                    e.dataTransfer.setData("courseType", item.courseType);
                                    e.dataTransfer.effectAllowed = "move";
                                  }}
                                  className="p-3 border border-border rounded-lg hover:bg-accent/50 cursor-grab active:cursor-grabbing transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: getCourseColorValue(course?.color) }}
                                      />
                                      <h3 className="text-sm text-foreground">{item.name}</h3>
                                    </div>
                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Right Panel - Calendar */}
        <div className="flex-1 flex flex-col">
          {/* Filters */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center gap-4 mb-4 justify-center">
              {isStudent ? (
                // Student view: show fixed info without filters or edit button
                <div className="text-sm text-muted-foreground">
                  正在檢視：<span className="text-foreground font-medium">{authUser?.name}</span>
                </div>
              ) : (
                // Coach view: show student search and edit button
                <>
                  <StudentSearchSelect
                    students={searchableStudents}
                    value={selectedStudentId}
                    onChange={handleStudentChange}
                    placeholder="搜尋學員..."
                    disabled={mode === "edit"}
                    allowAllStudents={mode === "view"}
                    className="w-[280px]"
                  />
                  {mode === "view" && canEdit && (
                    <>
                      <Button
                        className="flex items-center gap-2"
                        onClick={handleEnterEditMode}
                        disabled={!selectedStudentId || selectedStudentId === ""}
                      >
                        <Edit className="w-4 h-4" />
                        編輯課表
                      </Button>
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => setImportDialogOpen(true)}
                      >
                        <Upload className="w-4 h-4" />
                        匯入課表
                      </Button>
                    </>
                  )}
                  {mode === "edit" && selectedStudentInfo && (
                    <div className="text-sm text-muted-foreground">
                      正在編輯：<span className="text-foreground font-medium">{selectedStudentInfo.name}</span>
                      <span className="text-muted-foreground ml-1">({selectedStudentInfo.team})</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                <Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}>
                  <SelectTrigger className="w-auto min-w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={String(currentMonth)} onValueChange={(v) => setCurrentMonth(Number(v))}>
                  <SelectTrigger className="w-[80px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((name, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 ml-2"
                onClick={() => {
                  const today = new Date();
                  setCurrentYear(today.getFullYear());
                  setCurrentMonth(today.getMonth() + 1);
                }}
              >
                今天
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="bg-card rounded-lg border border-border">
              {/* Header */}
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map((day, i) => (
                  <div
                    key={day}
                    className={`p-4 text-center text-sm text-muted-foreground ${
                      i < 6 ? "border-r border-border" : ""
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7">
                {allDays.slice(0, 35).map((item, idx) => {
                  const events = item.isCurrentMonth ? getFilteredEvents(item.day) : [];
                  const isLastInRow = (idx + 1) % 7 === 0;
                  const isLastRow = idx >= 28;
                  const isDragOver = mode === "edit" && dragOverDay === item.day && item.isCurrentMonth;
                  
                  // Check if this day is today
                  const today = new Date();
                  const isToday = item.isCurrentMonth && 
                    item.day === today.getDate() && 
                    currentMonth === today.getMonth() + 1 && 
                    currentYear === today.getFullYear();

                  return (
                    <div
                      key={idx}
                      onDragOver={(e) => handleDragOver(e, item.day, item.isCurrentMonth)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item.day, item.isCurrentMonth)}
                      className={`min-h-28 p-2 transition-colors ${
                        !isLastInRow ? "border-r border-border" : ""
                      } ${!isLastRow ? "border-b border-border" : ""} ${
                        isDragOver ? "bg-accent/50" : ""
                      } ${item.isCurrentMonth ? "" : "bg-muted/20"} ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      <div
                        className={`text-sm mb-2 inline-flex items-center justify-center ${
                          isToday 
                            ? "w-7 h-7 rounded-full bg-primary text-primary-foreground font-semibold" 
                            : item.isCurrentMonth 
                              ? "text-foreground" 
                              : "text-muted-foreground/50"
                        }`}
                      >
                        {item.day}
                      </div>
                      {events?.map((event, eventIdx) => {
                        const isDragging = draggingEvent?.day === item.day && draggingEvent?.eventIdx === eventIdx;
                        // Use courseColor from event data (already fetched with the event)
                        // Fallback to context lookup only if event.courseColor is missing
                        const courseColorKey = event.courseColor || (() => {
                          const course = event.courseType === "personal"
                            ? getPersonalCourseById(event.courseId)
                            : getCourseById(event.courseId) || getPersonalCourseById(event.courseId);
                          return course?.color;
                        })();
                        const courseColor = getCourseColorValue(courseColorKey);
                        const isDarkColor = isCourseColorDark(courseColorKey);
                        const textColor = isDarkColor ? '#ffffff' : 'hsl(var(--foreground))';
                        
                        return (
                          <div 
                            key={eventIdx} 
                            className={`relative group ${isDragging ? "opacity-50" : ""}`}
                            draggable={mode === "edit"}
                            onDragStart={(e) => handleCalendarEventDragStart(e, item.day, eventIdx, event)}
                            onDragEnd={handleDragEnd}
                          >
                            <div
                              onClick={() => handleEventClick(event)}
                              style={{ 
                                backgroundColor: courseColor,
                                color: textColor
                              }}
                              className={`text-xs px-2 py-1 rounded mb-1 transition-colors cursor-pointer hover:opacity-90 ${
                                mode === "edit" ? "cursor-grab active:cursor-grabbing" : ""
                              }`}
                            >
                              {mode === "view" ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{event.name}</span>
                                  <span className="text-[10px] opacity-70">{event.team} - {event.studentName}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <GripVertical className="w-3 h-3 opacity-70 flex-shrink-0" />
                                  <span className="truncate">{event.name}</span>
                                </div>
                              )}
                            </div>
                            {mode === "edit" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEvent(item.day, eventIdx);
                                }}
                                className="absolute top-0 right-0 w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transform translate-x-1 -translate-y-1 transition-opacity hover:scale-110"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 匯入課表 Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              匯入課表
            </DialogTitle>
            <DialogDescription>
              上傳 CSV 或 Excel 檔案，批次匯入學員課表資料
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 檔案上傳區域（placeholder） */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">
                拖曳檔案至此處或點擊上傳
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支援格式：CSV、Excel（.xlsx）
              </p>
            </div>

            {/* 匯入欄位說明 */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium">匯入欄位需包含：</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>學員姓名 / Email</li>
                <li>日期（課程日期）</li>
                <li>課程名稱</li>
                <li>課程類型（公用 / 個人）</li>
              </ul>
            </div>

            {/* 開發中提示 */}
            <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">此功能尚在開發中</p>
                <p className="mt-0.5 text-yellow-600 dark:text-yellow-400">
                  匯入格式範本確認後將開放使用，目前僅提供 UI 預覽。
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button disabled>
              <Upload className="w-4 h-4 mr-2" />
              開始匯入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Schedule;
