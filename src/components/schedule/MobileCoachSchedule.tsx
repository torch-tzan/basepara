import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { StudentSearchSelect } from "@/components/ui/student-search-select";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import { useScheduleEventsByMonth, type ScheduleEventWithDetails } from "@/hooks/useSupabaseSchedule";

interface CalendarEvent {
  courseId: string;
  name: string;
  studentId: string;
  studentName: string;
  team: string;
  highlight?: boolean;
}

type CalendarEventsType = Record<number, CalendarEvent[]>;

interface TeamData {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  name: string;
  teamKey: string;
  teamName?: string;
}

interface MobileCoachScheduleProps {
  currentYear: number;
  currentMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  teams: TeamData[];
  students: StudentData[];
  accessibleStudentIds: string[];
}

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

// Year options
const currentYearNum = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYearNum - 2 + i);

// Transform Supabase events to CalendarEvent
const transformScheduleEvents = (events: Record<number, ScheduleEventWithDetails[]>): CalendarEventsType => {
  return Object.fromEntries(
    Object.entries(events).map(([day, evts]) => [
      parseInt(day, 10),
      evts.map(e => ({
        courseId: e.courseId,
        name: e.courseName,
        studentId: e.studentId,
        studentName: e.studentName,
        team: e.teamName,
        highlight: e.highlight,
      }))
    ])
  );
};

const MobileCoachSchedule = ({
  currentYear,
  currentMonth,
  onYearChange,
  onMonthChange,
  teams,
  students,
  accessibleStudentIds,
}: MobileCoachScheduleProps) => {
  const navigate = useNavigate();
  const { getCourseById } = useTrainingData();
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  // Use Supabase data for schedule events
  const { data: scheduleData, isLoading } = useScheduleEventsByMonth(currentYear, currentMonth);
  
  // Get events for current month dynamically
  const events = useMemo(() => {
    if (!scheduleData) return {};
    return transformScheduleEvents(scheduleData);
  }, [scheduleData]);
  
  // Today's date
  const todayDate = new Date();
  const isCurrentMonthView = currentYear === todayDate.getFullYear() && currentMonth === todayDate.getMonth() + 1;
  const [selectedDay, setSelectedDay] = useState<number | null>(isCurrentMonthView ? todayDate.getDate() : null);

  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left = next month
      if (currentMonth === 12) {
        onMonthChange(1);
        onYearChange(currentYear + 1);
      } else {
        onMonthChange(currentMonth + 1);
      }
      setSelectedDay(null);
    } else if (isRightSwipe) {
      // Swipe right = previous month
      if (currentMonth === 1) {
        onMonthChange(12);
        onYearChange(currentYear - 1);
      } else {
        onMonthChange(currentMonth - 1);
      }
      setSelectedDay(null);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [currentMonth, currentYear, onMonthChange, onYearChange]);

  // Searchable students list filtered by permissions
  const searchableStudents = useMemo(() => {
    return students
      .filter(s => accessibleStudentIds.includes(s.id))
      .map(s => {
        const team = teams.find(t => t.id === s.teamKey);
        return {
          id: s.id,
          name: s.name,
          teamName: team?.name || s.teamName || "",
        };
      });
  }, [students, accessibleStudentIds, teams]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      days.push({ day: nextMonthDay++, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Filter events based on selection and permissions
  const getFilteredEvents = (day: number) => {
    const dayEvents = events[day] || [];
    return dayEvents.filter(e => {
      // Must be accessible
      if (!accessibleStudentIds.includes(e.studentId)) return false;
      
      // Apply filter
      if (selectedStudentId && selectedStudentId !== "") {
        return e.studentId === selectedStudentId;
      }
      // No filter = show all accessible students
      return true;
    });
  };

  // Get all events for current month
  const monthEvents = useMemo(() => {
    const allEvents: { day: number; events: CalendarEvent[] }[] = [];
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getFilteredEvents(day);
      if (dayEvents.length > 0) {
        allEvents.push({ day, events: dayEvents });
      }
    }
    return allEvents;
  }, [events, selectedStudentId, accessibleStudentIds, currentYear, currentMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const handleGoToToday = () => {
    const today = new Date();
    onYearChange(today.getFullYear());
    onMonthChange(today.getMonth() + 1);
    setSelectedDay(today.getDate());
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (isCurrentMonth) {
      setSelectedDay(selectedDay === day ? null : day);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    const course = getCourseById(event.courseId);
    if (course) {
      navigate(`/schedule/course/${course.id}`);
    }
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
  };

  // Check if a day is today
  const today = new Date();
  const isToday = (day: number, isCurrentMonth: boolean) =>
    isCurrentMonth &&
    day === today.getDate() &&
    currentMonth === today.getMonth() + 1 &&
    currentYear === today.getFullYear();

  // Get events for selected day
  const selectedDayEvents = selectedDay ? getFilteredEvents(selectedDay) : [];

  return (
    <div className="space-y-4">
      {/* Student Search Filter */}
      <StudentSearchSelect
        students={searchableStudents}
        value={selectedStudentId}
        onChange={handleStudentChange}
        placeholder="搜尋學員..."
        allowAllStudents={true}
        className="w-full h-9"
      />

      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[100px] text-center">
            {currentYear}年{currentMonth}月
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleGoToToday}
        >
          <Calendar className="w-3 h-3 mr-1" />
          今天
        </Button>
      </div>

      {/* Collapsible Calendar */}
      <Collapsible open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
              <span className="text-sm font-medium">月曆檢視</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isCalendarOpen ? '' : '-rotate-90'}`} />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-t border-border">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs text-muted-foreground font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div 
              className="grid grid-cols-7 border-t border-border"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {calendarDays.map((item, idx) => {
                const dayEvents = item.isCurrentMonth ? getFilteredEvents(item.day) : [];
                const isSelected = selectedDay === item.day && item.isCurrentMonth;
                const isTodayCell = isToday(item.day, item.isCurrentMonth);
                const hasCourses = dayEvents.length > 0;

                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(item.day, item.isCurrentMonth)}
                    className={`
                      relative h-12 flex flex-col items-center justify-center
                      border-b border-r border-border/50 cursor-pointer transition-colors
                      ${!item.isCurrentMonth ? "bg-muted/20" : ""}
                      ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : ""}
                      ${isTodayCell && !isSelected ? "bg-primary/5" : ""}
                    `}
                  >
                    <span
                      className={`
                        text-sm flex items-center justify-center
                        ${isTodayCell ? "w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs" : ""}
                        ${!item.isCurrentMonth ? "text-muted-foreground/40" : "text-foreground"}
                      `}
                    >
                      {item.day}
                    </span>
                    {hasCourses && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((event, i) => {
                          const course = getCourseById(event.courseId);
                          const color = getCourseColorValue(course?.color);
                          return (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <span className="text-[6px] text-muted-foreground">+</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details */}
            {selectedDay !== null && (
              <div className="p-3 border-t border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">
                    {currentMonth}/{selectedDay}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({weekDays[new Date(currentYear, currentMonth - 1, selectedDay).getDay()]})
                  </span>
                </div>

                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDayEvents.map((event, idx) => {
                      const course = getCourseById(event.courseId);
                      const courseColor = getCourseColorValue(course?.color);
                      const isDarkColor = isCourseColorDark(course?.color);
                      const textColor = isDarkColor ? "#ffffff" : "hsl(var(--foreground))";

                      return (
                        <div
                          key={idx}
                          onClick={() => handleEventClick(event)}
                          style={{
                            backgroundColor: courseColor,
                            color: textColor,
                          }}
                          className="px-3 py-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{event.name}</span>
                            <span className="text-xs opacity-80">{event.studentName}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    當天無課程
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Monthly Event List */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">
            本月課程 ({monthEvents.reduce((acc, d) => acc + d.events.length, 0)})
          </span>
          {selectedStudentId && selectedStudentId !== "" && (
            <span className="text-xs text-muted-foreground">
              已篩選
            </span>
          )}
        </div>
        
        {monthEvents.length > 0 ? (
          <div className="divide-y divide-border max-h-[400px] overflow-auto">
            {monthEvents.map(({ day, events: dayEvents }) => (
              <div key={day} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    isToday(day, true) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentMonth}/{day} ({weekDays[new Date(currentYear, currentMonth - 1, day).getDay()]})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayEvents.map((event, idx) => {
                    const course = getCourseById(event.courseId);
                    const courseColor = getCourseColorValue(course?.color);
                    const isDarkColor = isCourseColorDark(course?.color);
                    const textColor = isDarkColor ? "#ffffff" : "hsl(var(--foreground))";

                    return (
                      <div
                        key={idx}
                        onClick={() => handleEventClick(event)}
                        style={{
                          backgroundColor: courseColor,
                          color: textColor,
                        }}
                        className="px-3 py-2 rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{event.name}</span>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3 opacity-60" />
                            <span className="text-xs opacity-80">{event.studentName}</span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {selectedStudentId ? "該篩選條件下無課程" : "本月無課程安排"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCoachSchedule;
