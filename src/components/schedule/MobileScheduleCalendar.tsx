import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar, ChevronRight as ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import { useScheduleEventsByMonth, type ScheduleEventWithDetails } from "@/hooks/useSupabaseSchedule";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEvent {
  courseId: string;
  name: string;
  studentId: string;
  studentName: string;
  team: string;
  highlight?: boolean;
  courseType?: string; // "public" or "personal"
}

type CalendarEventsType = Record<number, CalendarEvent[]>;

interface MobileScheduleCalendarProps {
  studentId: string;
  currentYear: number;
  currentMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
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
        courseType: e.courseType,
      }))
    ])
  );
};

const MobileScheduleCalendar = ({
  studentId,
  currentYear,
  currentMonth,
  onYearChange,
  onMonthChange,
}: MobileScheduleCalendarProps) => {
  const navigate = useNavigate();
  const { getCourseById, getPersonalCourseById } = useTrainingData();
  
  // Use Supabase data for schedule events
  const { data: scheduleData, isLoading } = useScheduleEventsByMonth(currentYear, currentMonth);
  
  // Get events for current month dynamically
  const events = useMemo(() => {
    if (!scheduleData) return {};
    return transformScheduleEvents(scheduleData);
  }, [scheduleData]);
  
  // Default to today's date
  const todayDate = new Date();
  const isCurrentMonthView = currentYear === todayDate.getFullYear() && currentMonth === todayDate.getMonth() + 1;
  const [selectedDay, setSelectedDay] = useState<number>(isCurrentMonthView ? todayDate.getDate() : 1);

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
      setSelectedDay(1);
    } else if (isRightSwipe) {
      // Swipe right = previous month
      if (currentMonth === 1) {
        onMonthChange(12);
        onYearChange(currentYear - 1);
      } else {
        onMonthChange(currentMonth - 1);
      }
      setSelectedDay(1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }, [currentMonth, currentYear, onMonthChange, onYearChange]);

  // Generate calendar days - compact 6-row grid
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days: { day: number; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }

    // Next month days to complete 6 rows (42 cells)
    while (days.length < 42) {
      days.push({ day: days.length - daysInMonth - firstDayOfMonth + 1, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Filter events for current student
  const getStudentEvents = (day: number) => {
    const dayEvents = events[day] || [];
    return dayEvents.filter((e) => e.studentId === studentId);
  };

  // Navigate months with swipe-like button
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(12);
      onYearChange(currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(1);
      onYearChange(currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1);
    }
    setSelectedDay(1);
  };

  const handleGoToToday = () => {
    const today = new Date();
    onYearChange(today.getFullYear());
    onMonthChange(today.getMonth() + 1);
    setSelectedDay(today.getDate());
  };

  const handleDayClick = (day: number, isCurrentMonth: boolean) => {
    if (isCurrentMonth) {
      setSelectedDay(day);
    }
  };

  const handleCourseClick = (courseId: string, courseType?: string) => {
    if (courseType === "personal") {
      navigate(`/schedule/course/${courseId}?type=personal`);
    } else {
      navigate(`/schedule/course/${courseId}`);
    }
  };

  // Check if a day is today
  const today = new Date();
  const isToday = (day: number, isCurrentMonth: boolean) =>
    isCurrentMonth &&
    day === today.getDate() &&
    currentMonth === today.getMonth() + 1 &&
    currentYear === today.getFullYear();

  // Get events for selected day
  const selectedDayEvents = getStudentEvents(selectedDay);

  // Get day of week for selected day
  const selectedDayOfWeek = weekDays[new Date(currentYear, currentMonth - 1, selectedDay).getDay()];

  // Calculate total courses this month for student
  const totalMonthCourses = useMemo(() => {
    let count = 0;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      count += getStudentEvents(d).length;
    }
    return count;
  }, [events, studentId, currentYear, currentMonth]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month Navigation - Desktop Style */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Select value={String(currentYear)} onValueChange={(v) => onYearChange(Number(v))}>
              <SelectTrigger className="w-auto min-w-[70px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}年</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(currentMonth)} onValueChange={(v) => onMonthChange(Number(v))}>
              <SelectTrigger className="w-[65px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((name, idx) => (
                  <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleGoToToday}
        >
          今天
        </Button>
      </div>

      {/* Compact Calendar Grid - with swipe gesture */}
      <div 
        className="bg-card border-b border-border"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Weekday Headers - smaller */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`py-1.5 text-center text-[10px] font-medium ${
                idx === 0 ? "text-destructive/70" : idx === 6 ? "text-primary/70" : "text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days - compact cells */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-px bg-border/30">
            {Array.from({ length: 42 }).map((_, idx) => (
              <div key={idx} className="h-9 bg-card flex items-center justify-center">
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-border/30">
            {calendarDays.map((item, idx) => {
              const dayEvents = item.isCurrentMonth ? getStudentEvents(item.day) : [];
              const isSelected = selectedDay === item.day && item.isCurrentMonth;
              const isTodayCell = isToday(item.day, item.isCurrentMonth);
              const hasCourses = dayEvents.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(item.day, item.isCurrentMonth)}
                  className={`
                    relative h-12 flex flex-col items-center justify-start pt-1.5 pb-4 bg-card
                    cursor-pointer transition-all active:bg-primary/10
                    ${!item.isCurrentMonth ? "opacity-30" : ""}
                    ${isSelected ? "bg-primary/10" : ""}
                  `}
                >
                  <span
                    className={`
                      text-xs flex items-center justify-center transition-all
                      ${isTodayCell 
                        ? "w-6 h-6 rounded-full bg-primary text-primary-foreground font-bold" 
                        : isSelected 
                          ? "w-6 h-6 rounded-full ring-2 ring-primary font-medium" 
                          : ""
                      }
                      ${!item.isCurrentMonth ? "text-muted-foreground" : "text-foreground"}
                    `}
                  >
                    {item.day}
                  </span>
                  {/* Course indicator - colored dots only */}
                  {hasCourses && (
                    <div className="absolute bottom-1 flex gap-1">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div 
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getCourseColorValue(getCourseById(event.courseId)?.color) }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Day Schedule - Only show when a day is selected */}
      {selectedDay && (
        <div className="flex-1 overflow-auto">
          {/* Day Header - sticky */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2.5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold">
                  {selectedDay}日
                </span>
                <span className="text-sm text-muted-foreground">
                  週{selectedDayOfWeek}
                </span>
                {isToday(selectedDay, true) && (
                  <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">
                    今天
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedDayEvents.length} 堂課程
              </span>
            </div>
          </div>

          {/* Course List */}
          <div className="px-3 py-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map((event, idx) => {
                  const course = getCourseById(event.courseId);
                  const personalCourse = getPersonalCourseById(event.courseId);
                  const displayCourse = course || personalCourse;
                  const courseColor = getCourseColorValue(displayCourse?.color);
                  const isDarkColor = isCourseColorDark(displayCourse?.color);
                  const textColor = isDarkColor ? "#ffffff" : "hsl(var(--foreground))";

                  return (
                    <div
                      key={idx}
                      onClick={() => handleCourseClick(event.courseId, event.courseType)}
                      style={{
                        backgroundColor: courseColor,
                        color: textColor,
                      }}
                      className="px-4 py-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[15px] truncate">{event.name}</h3>
                          {displayCourse?.category && (
                            <p className="text-xs opacity-75 mt-0.5">{displayCourse.category}</p>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 opacity-50 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-10 h-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">當天無課程安排</p>
                <p className="text-xs text-muted-foreground/60 mt-1">選擇其他日期查看課程</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileScheduleCalendar;
