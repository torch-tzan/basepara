// ============= Shared Students Configuration =============
// This is the single source of truth for student data
// mockData.ts and StudentsContext.tsx import from this file

import { getTeamNameById } from "./teamsConfig";
import { getCoachConfigsByTeam } from "./coachesConfig";

export interface StudentConfig {
  id: string;
  name: string;
  teamId: string;
  /** 性別（必填，預設 male） */
  gender: "male" | "female";
  position: string;
  height: string;
  weight: string;
  birthday: string;
  email: string;
  throwingHand: string;
  battingHand: string;
  lastTest: string;
  responsibleCoachIds: string[]; // Coach IDs from coachesConfig
}

// Base student configuration - the single source of truth
export const studentsConfig: StudentConfig[] = [
  {
    id: "1",
    name: "王維中",
    teamId: "yongping",
    gender: "male",
    position: "投手",
    height: "175",
    weight: "68",
    birthday: "2008/03/15",
    email: "wang.weizhong@email.com",
    throwingHand: "右",
    battingHand: "右",
    lastTest: "2025/01/18",
    responsibleCoachIds: ["coach1", "coach2"],
  },
  {
    id: "2",
    name: "李明軒",
    teamId: "yongping",
    gender: "male",
    position: "捕手",
    height: "170",
    weight: "65",
    birthday: "2008/05/22",
    email: "li.mingxuan@email.com",
    throwingHand: "右",
    battingHand: "左",
    lastTest: "2025/01/17",
    responsibleCoachIds: ["coach1"],
  },
  {
    id: "3",
    name: "張佳豪",
    teamId: "jiangong",
    gender: "male",
    position: "內野手",
    height: "168",
    weight: "62",
    birthday: "2007/08/10",
    email: "zhang.jiahao@email.com",
    throwingHand: "右",
    battingHand: "右",
    lastTest: "2025/01/16",
    responsibleCoachIds: ["coach3", "coach2"],
  },
  {
    id: "4",
    name: "陳志偉",
    teamId: "taichung",
    gender: "male",
    position: "外野手",
    height: "172",
    weight: "70",
    birthday: "2007/11/08",
    email: "chen.zhiwei@email.com",
    throwingHand: "右",
    battingHand: "左",
    lastTest: "2025/01/15",
    responsibleCoachIds: ["coach4"],
  },
  {
    id: "5",
    name: "林宇翔",
    teamId: "chiayi",
    gender: "male",
    position: "投手",
    height: "178",
    weight: "72",
    birthday: "2007/02/28",
    email: "lin.yuxiang@email.com",
    throwingHand: "左",
    battingHand: "左",
    lastTest: "2025/01/14",
    responsibleCoachIds: ["coach5"],
  },
  {
    id: "6",
    name: "黃建華",
    teamId: "yongping",
    gender: "male",
    position: "內野手",
    height: "165",
    weight: "58",
    birthday: "2008/09/05",
    email: "huang.jianhua@email.com",
    throwingHand: "右",
    battingHand: "右",
    lastTest: "2025/01/13",
    responsibleCoachIds: ["coach2"],
  },
];

// Helper to get student by ID
export const getStudentConfigById = (id: string): StudentConfig | undefined => {
  return studentsConfig.find((s) => s.id === id);
};

// Helper to get students by team
export const getStudentConfigsByTeam = (teamId: string): StudentConfig[] => {
  return studentsConfig.filter((s) => s.teamId === teamId);
};

// Transform config to full student data with derived fields
export const getFullStudentData = (config: StudentConfig) => {
  const teamCoaches = getCoachConfigsByTeam(config.teamId).map((c) => c.name);
  const responsibleCoaches = config.responsibleCoachIds
    .map((id) => {
      const coach = getCoachConfigsByTeam(config.teamId).find((c) => c.id === id);
      if (coach) return coach.name;
      // Check all coaches if not in team
      const allCoaches = studentsConfig
        .flatMap((s) => getCoachConfigsByTeam(s.teamId))
        .find((c) => c.id === id);
      return allCoaches?.name;
    })
    .filter(Boolean) as string[];

  return {
    id: config.id,
    name: config.name,
    teamId: config.teamId,
    teamName: getTeamNameById(config.teamId),
    gender: config.gender,
    position: config.position,
    height: config.height,
    weight: config.weight,
    birthday: config.birthday,
    email: config.email,
    throwingHand: config.throwingHand,
    battingHand: config.battingHand,
    lastTest: config.lastTest,
    teamCoaches,
    responsibleCoaches,
  };
};

// Get all students with full data
export const getAllStudentsData = () => {
  return studentsConfig.map(getFullStudentData);
};
