import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTrainingData } from "@/contexts/TrainingDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useDataAccess } from "@/hooks/useDataAccess";
import { useScheduleEvents, type ScheduleEventWithDetails } from "@/hooks/useSupabaseSchedule";
import { getCourseColorValue, isCourseColorDark } from "@/data/trainingTemplates";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleSession {
  courseId?: string;
  title: string;
  student?: string;
}

interface WeekDay {
  day: string;
  date: string;
  sessions: ScheduleSession[];
}

interface WeeklyCalendarProps {
  showStudentInfo?: boolean;
  compact?: boolean; // Mobile compact mode
}

// Helper to get week days based on a reference date (Sunday to Saturday)
const getWeekSchedule = (
  events: Record<string, ScheduleEventWithDetails[]>, 
  isStudent: boolean, 
  studentId?: string,
  accessibleStudentIds?: string[]
): { schedule: WeekDay[]; todayIndex: number } => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  // Calculate the Sunday of the current week
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dayOfWeek);

  const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

  const schedule = dayNames.map((dayName, index) => {
    const currentDate = new Date(sunday);
    currentDate.setDate(sunday.getDate() + index);
    const dayNumber = currentDate.getDate();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Create the date key in YYYY-MM-DD format
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;

    const dayEvents = events[dateKey] || [];
    
    // Filter events based on role and permissions
    let filteredEvents = dayEvents;
    
    if (isStudent && studentId) {
      // Student: only see their own events
      filteredEvents = dayEvents.filter(e => e.studentId === studentId);
    } else if (accessibleStudentIds) {
      // Coach: only see events for accessible students
      filteredEvents = dayEvents.filter(e => accessibleStudentIds.includes(e.studentId));
    }

    const sessions = filteredEvents.map(event => ({
      courseId: event.courseId,
      title: event.courseName,
      student: isStudent ? undefined : `${event.teamName} ${event.studentName}`,
    }));

    return {
      day: dayName,
      date: `${month}/${dayNumber}`,
      sessions,
    };
  });

  return { schedule, todayIndex: dayOfWeek };
};

const WeeklyCalendar = ({ showStudentInfo = false, compact = false }: WeeklyCalendarProps) => {
  const navigate = useNavigate();
  const { getCourseById, courses } = useTrainingData();
  const { authUser } = useAuth();
  const isStudent = authUser?.role === "student";
  
  // Get accessible student IDs based on permissions
  const { accessibleStudentIds } = useDataAccess("schedule");

  // Fetch schedule events from Supabase
  const { data: scheduleEventsData, isLoading } = useScheduleEvents();

  // Generate weekly schedule from Supabase data with permission filtering
  const { schedule, todayIndex } = useMemo(() => {
    const events = scheduleEventsData || {};
    const studentId = isStudent ? accessibleStudentIds[0] : undefined;
    return getWeekSchedule(events, isStudent, studentId, isStudent ? undefined : accessibleStudentIds);
  }, [isStudent, accessibleStudentIds, scheduleEventsData]);

  // Get course by name (fallback when courseId is not provided)
  const getCourseByName = (name: string) => {
    return courses.find(c => c.name === name);
  };

  const handleEventClick = (session: ScheduleSession) => {
    const course = session.courseId 
      ? getCourseById(session.courseId) 
      : getCourseByName(session.title);
    
    if (course) {
      navigate(`/schedule/course/${course.id}`);
    }
  };

  // Loading state
  if (isLoading) {
    if (compact) {
      return (
        <div className="bg-card rounded-lg border border-border p-4 space-y-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      );
    }
    return (
      <div className="bg-card rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`p-3 ${i < 6 ? "border-r border-border" : ""}`}>
              <Skeleton className="h-4 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-10 mx-auto" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className={`min-h-24 p-2 ${i < 6 ? "border-r border-border" : ""}`}>
              <Skeleton className="h-8 w-full mb-1" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Compact mobile layout - vertical list for today and upcoming
  if (compact) {
    const todaySchedule = schedule[todayIndex];
    const upcomingDays = schedule.filter((_, idx) => idx > todayIndex).slice(0, 3);

    return (
      <>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {/* Today's Schedule */}
          {todaySchedule && (
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-medium text-primary">今天</div>
                <div className="text-xs text-muted-foreground">
                  {todaySchedule.day} {todaySchedule.date}
                </div>
              </div>
              {todaySchedule.sessions.length > 0 ? (
                <div className="space-y-2">
                  {todaySchedule.sessions.map((session, idx) => {
                    const course = session.courseId 
                      ? getCourseById(session.courseId) 
                      : getCourseByName(session.title);
                    const courseColor = getCourseColorValue(course?.color);
                    const isDarkColor = isCourseColorDark(course?.color);
                    const textColor = isDarkColor ? '#ffffff' : 'hsl(var(--foreground))';

                    return (
                      <div
                        key={idx}
                        onClick={() => handleEventClick(session)}
                        style={{ 
                          backgroundColor: courseColor,
                          color: textColor
                        }}
                        className="text-sm px-3 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <span className="font-medium">{session.title}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">今天沒有課程安排</div>
              )}
            </div>
          )}

          {/* Upcoming Days */}
          {upcomingDays.length > 0 && (
            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-3">即將到來</div>
              <div className="space-y-3">
                {upcomingDays.map((day, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-12 text-xs text-muted-foreground pt-0.5">
                      <div>{day.day}</div>
                      <div className="text-[10px]">{day.date}</div>
                    </div>
                    <div className="flex-1">
                      {day.sessions.length > 0 ? (
                        <div className="space-y-1">
                          {day.sessions.slice(0, 2).map((session, sIdx) => {
                            const course = session.courseId 
                              ? getCourseById(session.courseId) 
                              : getCourseByName(session.title);
                            const courseColor = getCourseColorValue(course?.color);
                            const isDarkColor = isCourseColorDark(course?.color);
                            const textColor = isDarkColor ? '#ffffff' : 'hsl(var(--foreground))';

                            return (
                              <div
                                key={sIdx}
                                onClick={() => handleEventClick(session)}
                                style={{ 
                                  backgroundColor: courseColor,
                                  color: textColor
                                }}
                                className="text-xs px-2 py-1.5 rounded cursor-pointer hover:opacity-90 transition-opacity"
                              >
                                {session.title}
                              </div>
                            );
                          })}
                          {day.sessions.length > 2 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{day.sessions.length - 2} 堂課
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">無課程</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Desktop layout - 7-column grid
  return (
    <>
      <div className="bg-card rounded-lg border border-border">
        {/* Header */}
        <div className="grid grid-cols-7 border-b border-border">
          {schedule.map((item, i) => {
            const isToday = i === todayIndex;
            return (
              <div
                key={item.day}
                className={`p-3 text-center ${
                  i < 6 ? "border-r border-border" : ""
                } ${isToday ? "bg-primary/10" : ""}`}
              >
                <div className={`text-sm ${isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {item.day}
                </div>
                <div className={`text-xs mt-0.5 ${isToday ? "text-primary/80" : "text-muted-foreground/70"}`}>
                  {item.date}
                </div>
              </div>
            );
          })}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {schedule.map((item, idx) => {
            const isLastInRow = idx === 6;
            const isToday = idx === todayIndex;

            return (
              <div
                key={idx}
                className={`min-h-24 p-2 ${
                  !isLastInRow ? "border-r border-border" : ""
                } ${isToday ? "bg-primary/5" : ""}`}
              >
                {item.sessions.map((session, sessionIdx) => {
                  const course = session.courseId 
                    ? getCourseById(session.courseId) 
                    : getCourseByName(session.title);
                  const courseColor = getCourseColorValue(course?.color);
                  const isDarkColor = isCourseColorDark(course?.color);
                  const textColor = isDarkColor ? '#ffffff' : 'hsl(var(--foreground))';

                  return (
                    <div
                      key={sessionIdx}
                      onClick={() => handleEventClick(session)}
                      style={{ 
                        backgroundColor: courseColor,
                        color: textColor
                      }}
                      className="text-xs px-2 py-1.5 rounded mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{session.title}</span>
                        {showStudentInfo && session.student && (
                          <span className="text-[10px] opacity-70 mt-0.5">{session.student}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default WeeklyCalendar;
