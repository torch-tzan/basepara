// Centralized mock data for Students, Schedule, and Reports
// All data is properly interconnected

import { coachesConfig } from "./coachesConfig";
import { teamsConfig } from "./teamsConfig";
import { studentsConfig, getAllStudentsData, type StudentConfig } from "./studentsConfig";
import { getAllReportsData, type ReportData, type ReportType } from "./reportsConfig";
import { getAllScheduleEvents, getScheduleEventsByMonth, type ScheduleEvent, type ScheduleEventsType } from "./scheduleConfig";

// ============= Teams (derived from shared config) =============
export const teamsData = teamsConfig;

// ============= Coaches (derived from shared config) =============
export const coachesData = coachesConfig.map((c) => ({
  id: c.id,
  name: c.name,
  teams: c.teams,
}));

// ============= Students (derived from shared config) =============
export interface StudentData {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  position: string;
  height: string;
  weight: string;
  birthday: string;
  email: string;
  throwingHand: string;
  battingHand: string;
  lastTest: string;
  teamCoaches: string[];
  responsibleCoaches: string[];
}

export const studentsData: StudentData[] = getAllStudentsData();

// Re-export for convenience
export type { StudentConfig };

// Helper functions for students
export const getStudentById = (id: string): StudentData | undefined => {
  return studentsData.find(s => s.id === id);
};

export const getStudentsByTeam = (teamId: string): StudentData[] => {
  return studentsData.filter(s => s.teamId === teamId);
};

export const getStudentOptions = (teamId?: string) => {
  const students = teamId ? getStudentsByTeam(teamId) : studentsData;
  return students.map(s => ({ value: s.id, label: s.name }));
};

// ============= Schedule Events (derived from shared config) =============
export type { ScheduleEvent, ScheduleEventsType };
export { getScheduleEventsByMonth } from "./scheduleConfig";

// Calendar events - date string is the key (YYYY-MM-DD format)
export const initialScheduleEvents: ScheduleEventsType = getAllScheduleEvents();

// ============= Reports (derived from shared config) =============
export type { ReportData, ReportType };

export const reportsData: ReportData[] = getAllReportsData();

// Helper functions for reports (re-exported from reportsConfig)
export { getReportsByStudentId as getReportsByStudent, getReportsByTeamId as getReportsByTeam } from "./reportsConfig";

// ============= Filter Helpers =============
export const teamOptions = [
  { value: "all", label: "全部球隊" },
  ...teamsData.map(t => ({ value: t.id, label: t.name })),
];

export const coachOptions = [
  { value: "all", label: "所有教練" },
  ...coachesData.map(c => ({ value: c.id, label: c.name })),
];
