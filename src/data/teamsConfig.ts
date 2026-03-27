// ============= Shared Teams Configuration =============
// This is the single source of truth for team data
// mockData.ts imports from this file

export interface TeamConfig {
  id: string;
  name: string;
}

// 球隊屬性選項
export const teamAttributeOptions = [
  { value: "棒球", label: "棒球" },
  { value: "壘球", label: "壘球" },
];

// 球隊層級選項
export const teamLevelOptions = [
  { value: "職業", label: "職業" },
  { value: "成棒", label: "成棒" },
  { value: "大專甲組", label: "大專甲組" },
  { value: "大專乙組", label: "大專乙組" },
  { value: "高中甲組", label: "高中甲組" },
  { value: "高中乙組", label: "高中乙組" },
  { value: "國中甲組", label: "國中甲組" },
  { value: "國中乙組", label: "國中乙組" },
  { value: "國小", label: "國小" },
];

// Base team configuration - the single source of truth
export const teamsConfig: TeamConfig[] = [
  { id: "yongping", name: "永平國中" },
  { id: "jiangong", name: "建功高中" },
  { id: "taichung", name: "台中高工" },
  { id: "chiayi", name: "嘉義高中" },
];

// Helper to get team by ID
export const getTeamConfigById = (id: string): TeamConfig | undefined => {
  return teamsConfig.find((t) => t.id === id);
};

// Helper to get team name by ID
export const getTeamNameById = (id: string): string => {
  return teamsConfig.find((t) => t.id === id)?.name || "";
};

// Get team options for select dropdowns
export const getTeamOptions = () => {
  return teamsConfig.map((t) => ({ value: t.id, label: t.name }));
};

// Get team options with "all" option for filters
export const getTeamFilterOptions = () => {
  return [
    { value: "all", label: "全部球隊" },
    ...teamsConfig.map((t) => ({ value: t.id, label: t.name })),
  ];
};
