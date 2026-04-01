// ============= Shared Reports Configuration =============
// This is the single source of truth for report data
// mockData.ts imports from this file

import { getStudentConfigById } from "./studentsConfig";
import { getTeamNameById } from "./teamsConfig";

export type ReportType = "打擊" | "投球";

export interface ModuleConfigEntry {
  module_id: string;
  module_name: string;
  order: number;
}

export interface ReportConfig {
  id: string;
  date: string;
  studentId: string;
  type: ReportType;
  title?: string;
  module_config?: { modules: ModuleConfigEntry[] };
  markdown_notes?: string;
}

// Base report configuration - the single source of truth
// 13 份報告涵蓋不同學員、不同類型、不同模組組合
export const reportsConfig: ReportConfig[] = [
  // ───── R1：王維中 打擊（4 張圖表）─────
  {
    id: "mock-r1", date: "2026/03/20", studentId: "1", type: "打擊",
    title: "王維中 - 打擊檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
      { module_id: "batting_3_1", module_name: "擊球仰角 / 初速趨勢圖", order: 2 },
      { module_id: "batting_3_4", module_name: "擊球落點與強勁程度場地圖", order: 3 },
      { module_id: "batting_3_7", module_name: "好球帶熱區圖", order: 4 },
    ]},
    markdown_notes: "## 摘要\n本次檢測揮棒速度穩定，擊球品質有進步。\n\n### 建議\n- 加強對內角球的反應速度\n- 維持目前的攻擊角度",
  },
  // ───── R2：王維中 投球（3 張圖表）─────
  {
    id: "mock-r2", date: "2026/03/18", studentId: "1", type: "投球",
    title: "王維中 - 投球檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 2 },
      { module_id: "pitching_4_3", module_name: "進壘點熱區圖", order: 3 },
    ]},
    markdown_notes: "快速球控球穩定，變化球仍需加強。",
  },
  // ───── R3：李明軒 打擊（4 張圖表，不同組合）─────
  {
    id: "mock-r3", date: "2026/03/15", studentId: "2", type: "打擊",
    title: "李明軒 - 打擊檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
      { module_id: "batting_3_2", module_name: "水平角 / 初速趨勢圖", order: 2 },
      { module_id: "batting_3_5", module_name: "攻擊角度 / 揮擊時間散佈圖", order: 3 },
      { module_id: "batting_3_6", module_name: "打擊選手個人及層級數據分佈圖", order: 4 },
    ]},
    markdown_notes: "### 觀察\n整體揮棒時間偏長，需要縮短 swing time。\n\n### 優點\n- 擊球仰角控制良好\n- Pull 方向初速提升",
  },
  // ───── R4：張佳豪 投球（3 張圖表，無 notes）─────
  {
    id: "mock-r4", date: "2026/03/12", studentId: "3", type: "投球",
    title: "張佳豪 - 投球檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 2 },
      { module_id: "pitching_4_4", module_name: "出手點散佈圖", order: 3 },
    ]},
  },
  // ───── R5：張佳豪 打擊（2 張圖表 - 精簡版）─────
  {
    id: "mock-r5", date: "2026/03/10", studentId: "3", type: "打擊",
    title: "張佳豪 - 打擊檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_1", module_name: "擊球仰角 / 初速趨勢圖", order: 1 },
      { module_id: "batting_3_3", module_name: "攻擊角度 / 擊球品質趨勢圖", order: 2 },
    ]},
  },
  // ───── R6：陳志偉 打擊（3 張圖表）─────
  {
    id: "mock-r6", date: "2026/03/08", studentId: "4", type: "打擊",
    title: "陳志偉 - 打擊檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
      { module_id: "batting_3_4", module_name: "擊球落點與強勁程度場地圖", order: 2 },
      { module_id: "batting_3_6", module_name: "打擊選手個人及層級數據分佈圖", order: 3 },
    ]},
    markdown_notes: "擊球品質提升，但場地圖顯示過多弱打球集中在左半邊。",
  },
  // ───── R7：陳志偉 投球（3 張圖表，無層級分佈）─────
  {
    id: "mock-r7", date: "2026/03/05", studentId: "4", type: "投球",
    title: "陳志偉 - 投球檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 1 },
      { module_id: "pitching_4_3", module_name: "進壘點熱區圖", order: 2 },
      { module_id: "pitching_4_4", module_name: "出手點散佈圖", order: 3 },
    ]},
  },
  // ───── R8：林宇翔 投球（2 張圖表 - 精簡版）─────
  {
    id: "mock-r8", date: "2026/03/01", studentId: "5", type: "投球",
    title: "林宇翔 - 投球檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
      { module_id: "pitching_4_3", module_name: "進壘點熱區圖", order: 2 },
    ]},
    markdown_notes: "## 分析\n球速提升至 **88 MPH**，旋轉效率 92%。\n\n建議增加滑球使用頻率。",
  },
  // ───── R9：黃建華 打擊（3 張圖表）─────
  {
    id: "mock-r9", date: "2026/02/25", studentId: "6", type: "打擊",
    title: "黃建華 - 打擊檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
      { module_id: "batting_3_7", module_name: "好球帶熱區圖", order: 2 },
      { module_id: "batting_3_5", module_name: "攻擊角度 / 揮擊時間散佈圖", order: 3 },
    ]},
  },
  // ───── R10：黃建華 投球（2 張圖表）─────
  {
    id: "mock-r10", date: "2026/02/20", studentId: "6", type: "投球",
    title: "黃建華 - 投球檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 2 },
    ]},
    markdown_notes: "### 觀察\n控球穩定度有進步，快速球進壘點更集中。\n\n### 待加強\n- 變速球的出手點一致性\n- 滑球水平位移量需增加",
  },
  // ───── R11：王維中 打擊（6 張圖表 - 完整版 All-in）─────
  {
    id: "mock-r11", date: "2026/02/15", studentId: "1", type: "打擊",
    title: "王維中 - 打擊完整檢測報告",
    module_config: { modules: [
      { module_id: "batting_3_0", module_name: "打擊概況摘要", order: 1 },
      { module_id: "batting_3_1", module_name: "擊球仰角 / 初速趨勢圖", order: 2 },
      { module_id: "batting_3_3", module_name: "攻擊角度 / 擊球品質趨勢圖", order: 3 },
      { module_id: "batting_3_4", module_name: "擊球落點與強勁程度場地圖", order: 4 },
      { module_id: "batting_3_5", module_name: "攻擊角度 / 揮擊時間散佈圖", order: 5 },
      { module_id: "batting_3_6", module_name: "打擊選手個人及層級數據分佈圖", order: 6 },
    ]},
    markdown_notes: "## 季前完整檢測\n\n此為季前完整版檢測，涵蓋所有打擊指標分析。\n\n### 重點\n1. 揮棒速度穩定維持 110+ kph\n2. 攻擊角度控制進步\n3. 場地分佈從拉打偏向全場\n\n### 訓練計畫\n- 每週三次 T 座打擊訓練\n- 著重 Oppo 方向練習",
  },
  // ───── R12：林宇翔 投球（4 張圖表 - 完整版）─────
  {
    id: "mock-r12", date: "2026/02/10", studentId: "5", type: "投球",
    title: "林宇翔 - 投球完整檢測報告",
    module_config: { modules: [
      { module_id: "pitching_4_1", module_name: "投球選手層級數據分佈圖", order: 1 },
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 2 },
      { module_id: "pitching_4_3", module_name: "進壘點熱區圖", order: 3 },
      { module_id: "pitching_4_4", module_name: "出手點散佈圖", order: 4 },
    ]},
    markdown_notes: "## 季前完整版報告\n\n四球種（FB/CB/SL/CH）均已檢測完成。\n\n### 亮點\n- 快速球尾勁提升，轉速增加 100 rpm\n- 滑球位移量進步明顯\n\n### 風險\n- 手肘外翻應力偏高，建議監控",
  },
  // ───── R13：李明軒 投球（1 張圖表 - 最精簡版）─────
  {
    id: "mock-r13", date: "2026/02/05", studentId: "2", type: "投球",
    title: "李明軒 - 投球快速檢測",
    module_config: { modules: [
      { module_id: "pitching_4_2", module_name: "球路位移圖", order: 1 },
    ]},
    markdown_notes: "快速球路位移檢測，單一圖表報告。",
  },
];

// Helper to get report by ID
export const getReportConfigById = (id: string): ReportConfig | undefined => {
  return reportsConfig.find((r) => r.id === id);
};

// Helper to get reports by student
export const getReportConfigsByStudent = (studentId: string): ReportConfig[] => {
  return reportsConfig.filter((r) => r.studentId === studentId);
};

// Helper to get reports by type
export const getReportConfigsByType = (type: ReportType): ReportConfig[] => {
  return reportsConfig.filter((r) => r.type === type);
};

// Full report data interface (with derived fields)
export interface ReportData {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  teamId: string;
  teamName: string;
  type: ReportType;
}

// Transform config to full report data with derived fields
export const getFullReportData = (config: ReportConfig): ReportData => {
  const student = getStudentConfigById(config.studentId);
  const teamId = student?.teamId || "";

  return {
    id: config.id,
    date: config.date,
    studentId: config.studentId,
    studentName: student?.name || "",
    teamId,
    teamName: getTeamNameById(teamId),
    type: config.type,
  };
};

// Get all reports with full data
export const getAllReportsData = (): ReportData[] => {
  return reportsConfig.map(getFullReportData);
};

// Get reports by student with full data
export const getReportsByStudentId = (studentId: string): ReportData[] => {
  return getReportConfigsByStudent(studentId).map(getFullReportData);
};

// Get reports by team with full data
export const getReportsByTeamId = (teamId: string): ReportData[] => {
  return reportsConfig
    .filter((r) => {
      const student = getStudentConfigById(r.studentId);
      return student?.teamId === teamId;
    })
    .map(getFullReportData);
};

// Report type options for filters
export const reportTypeOptions = [
  { value: "all", label: "全部類型" },
  { value: "打擊", label: "打擊" },
  { value: "投球", label: "投球" },
];
