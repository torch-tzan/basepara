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

// 縣市選項
export const countyOptions = [
  { value: "臺北市", label: "臺北市" },
  { value: "新北市", label: "新北市" },
  { value: "桃園市", label: "桃園市" },
  { value: "臺中市", label: "臺中市" },
  { value: "臺南市", label: "臺南市" },
  { value: "高雄市", label: "高雄市" },
  { value: "基隆市", label: "基隆市" },
  { value: "新竹市", label: "新竹市" },
  { value: "新竹縣", label: "新竹縣" },
  { value: "苗栗縣", label: "苗栗縣" },
  { value: "彰化縣", label: "彰化縣" },
  { value: "南投縣", label: "南投縣" },
  { value: "雲林縣", label: "雲林縣" },
  { value: "嘉義市", label: "嘉義市" },
  { value: "嘉義縣", label: "嘉義縣" },
  { value: "屏東縣", label: "屏東縣" },
  { value: "宜蘭縣", label: "宜蘭縣" },
  { value: "花蓮縣", label: "花蓮縣" },
  { value: "臺東縣", label: "臺東縣" },
  { value: "澎湖縣", label: "澎湖縣" },
  { value: "金門縣", label: "金門縣" },
  { value: "連江縣", label: "連江縣" },
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
