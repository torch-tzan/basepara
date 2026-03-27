// ============= Shared Schedule Configuration =============
// This is the single source of truth for schedule event data
// mockData.ts imports from this file

import { getStudentConfigById } from "./studentsConfig";
import { getTeamNameById } from "./teamsConfig";

// Course configuration (referenced by courseId)
export interface CourseConfig {
  id: string;
  name: string;
}

// Base courses - the single source of truth for course names
export const coursesConfig: CourseConfig[] = [
  { id: "c1", name: "基礎體能課程" },
  { id: "c2", name: "投手專項課程" },
  { id: "c3", name: "打擊專項課程" },
  { id: "c4", name: "核心肌群訓練" },
  { id: "c5", name: "下肢爆發力訓練" },
  { id: "c6", name: "投手熱身課程" },
  { id: "c7", name: "打擊熱身課程" },
  { id: "c8", name: "守備基礎訓練" },
  { id: "c9", name: "實戰打擊模擬" },
  { id: "c10", name: "投手控球訓練" },
  { id: "c11", name: "跑壘技巧訓練" },
  { id: "c12", name: "外野守備訓練" },
  { id: "c13", name: "速度與敏捷訓練" },
  { id: "c14", name: "投手牛棚練習" },
];

// Schedule event base configuration
export interface ScheduleEventConfig {
  courseId: string;
  studentId: string;
  highlight?: boolean;
}

// Schedule events by year-month-day key (format: "YYYY-MM-DD")
export type ScheduleEventsConfigType = Record<string, ScheduleEventConfig[]>;

// Generate schedule data for Jan-Mar 2026 (each student has 2+ courses per week)
const generateScheduleData = (): ScheduleEventsConfigType => {
  const events: ScheduleEventsConfigType = {};
  const studentIds = ["1", "2", "3", "4", "5", "6"];
  const courseIds = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14"];
  
  // Helper to get a deterministic course based on student and week
  const getCourseId = (studentId: string, weekIndex: number, dayOffset: number) => {
    const idx = (parseInt(studentId) + weekIndex + dayOffset) % courseIds.length;
    return courseIds[idx];
  };

  // Generate for Jan, Feb, Mar 2026
  const months = [
    { year: 2026, month: 1, days: 31 },
    { year: 2026, month: 2, days: 28 },
    { year: 2026, month: 3, days: 31 },
  ];

  months.forEach(({ year, month, days }) => {
    // For each student, assign 2 courses per week
    studentIds.forEach((studentId) => {
      // Calculate weekly slots based on student to spread them out
      const studentOffset = parseInt(studentId) - 1;
      
      // Generate 2 courses per week for each student
      for (let week = 0; week < 5; week++) {
        // First course day (Mon/Tue/Wed based on student)
        const day1 = week * 7 + 1 + (studentOffset % 3);
        // Second course day (Thu/Fri/Sat based on student)
        const day2 = week * 7 + 4 + (studentOffset % 3);
        
        if (day1 <= days) {
          const key1 = `${year}-${String(month).padStart(2, "0")}-${String(day1).padStart(2, "0")}`;
          if (!events[key1]) events[key1] = [];
          events[key1].push({
            courseId: getCourseId(studentId, week, 0),
            studentId,
            highlight: week === 2 && parseInt(studentId) % 2 === 0, // Some highlights
          });
        }
        
        if (day2 <= days) {
          const key2 = `${year}-${String(month).padStart(2, "0")}-${String(day2).padStart(2, "0")}`;
          if (!events[key2]) events[key2] = [];
          events[key2].push({
            courseId: getCourseId(studentId, week, 1),
            studentId,
          });
        }
      }
    });
  });

  return events;
};

// Base schedule configuration - the single source of truth
export const scheduleEventsConfig: ScheduleEventsConfigType = generateScheduleData();

// Helper to get course by ID
export const getCourseConfigById = (id: string): CourseConfig | undefined => {
  return coursesConfig.find((c) => c.id === id);
};

// Helper to get course name by ID
export const getCourseNameById = (id: string): string => {
  return coursesConfig.find((c) => c.id === id)?.name || "";
};

// Full schedule event interface (with derived fields)
export interface ScheduleEvent {
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  teamId: string;
  teamName: string;
  highlight?: boolean;
}

// Full schedule events type uses string keys (YYYY-MM-DD)
export type ScheduleEventsType = Record<string, ScheduleEvent[]>;

// Transform config to full schedule event with derived fields
export const getFullScheduleEvent = (config: ScheduleEventConfig): ScheduleEvent => {
  const student = getStudentConfigById(config.studentId);
  const teamId = student?.teamId || "";

  return {
    courseId: config.courseId,
    courseName: getCourseNameById(config.courseId),
    studentId: config.studentId,
    studentName: student?.name || "",
    teamId,
    teamName: getTeamNameById(teamId),
    highlight: config.highlight,
  };
};

// Get all schedule events with full data
export const getAllScheduleEvents = (): ScheduleEventsType => {
  const result: ScheduleEventsType = {};

  for (const [dateKey, events] of Object.entries(scheduleEventsConfig)) {
    result[dateKey] = events.map(getFullScheduleEvent);
  }

  return result;
};

// Get schedule events for a specific student
export const getScheduleEventsByStudent = (studentId: string): ScheduleEventsType => {
  const result: ScheduleEventsType = {};

  for (const [dateKey, events] of Object.entries(scheduleEventsConfig)) {
    const studentEvents = events
      .filter((e) => e.studentId === studentId)
      .map(getFullScheduleEvent);

    if (studentEvents.length > 0) {
      result[dateKey] = studentEvents;
    }
  }

  return result;
};

// Get schedule events for a specific team
export const getScheduleEventsByTeam = (teamId: string): ScheduleEventsType => {
  const result: ScheduleEventsType = {};

  for (const [dateKey, events] of Object.entries(scheduleEventsConfig)) {
    const teamEvents = events
      .filter((e) => {
        const student = getStudentConfigById(e.studentId);
        return student?.teamId === teamId;
      })
      .map(getFullScheduleEvent);

    if (teamEvents.length > 0) {
      result[dateKey] = teamEvents;
    }
  }

  return result;
};

// Helper to get events for a specific month (for calendar display)
export const getScheduleEventsByMonth = (year: number, month: number): Record<number, ScheduleEvent[]> => {
  const result: Record<number, ScheduleEvent[]> = {};
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}-`;

  for (const [dateKey, events] of Object.entries(scheduleEventsConfig)) {
    if (dateKey.startsWith(prefix)) {
      const day = parseInt(dateKey.split("-")[2], 10);
      result[day] = events.map(getFullScheduleEvent);
    }
  }

  return result;
};
