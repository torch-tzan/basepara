// ============= Shared Coaches Configuration =============
// This is the single source of truth for coach data
// Both mockData.ts and accountsData.ts import from this file

export interface CoachConfig {
  id: string;
  name: string;
  email: string;
  teams: string[]; // Team IDs
  roleId: "venue_coach" | "team_coach";
}

// Base coach configuration - the single source of truth
export const coachesConfig: CoachConfig[] = [
  {
    id: "coach1",
    name: "王大明",
    email: "wang.daming@example.com",
    teams: ["yongping"],
    roleId: "team_coach",
  },
  {
    id: "coach2",
    name: "李志豪",
    email: "li.zhihao@example.com",
    teams: ["yongping", "jiangong"],
    roleId: "venue_coach",
  },
  {
    id: "coach3",
    name: "張家銘",
    email: "zhang.jiaming@example.com",
    teams: ["jiangong"],
    roleId: "team_coach",
  },
  {
    id: "coach4",
    name: "陳建宏",
    email: "chen.jianhong@example.com",
    teams: ["taichung"],
    roleId: "team_coach",
  },
  {
    id: "coach5",
    name: "林育賢",
    email: "lin.yuxian@example.com",
    teams: ["chiayi", "taichung"],
    roleId: "venue_coach",
  },
];

// Helper to get coach by ID
export const getCoachConfigById = (id: string): CoachConfig | undefined => {
  return coachesConfig.find((c) => c.id === id);
};

// Helper to get coaches by team
export const getCoachConfigsByTeam = (teamId: string): CoachConfig[] => {
  return coachesConfig.filter((c) => c.teams.includes(teamId));
};
