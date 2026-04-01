// 報告圖表模組定義
// 對應規格：第三節（打擊）、第四節（投球）

export interface ReportModule {
  id: string;
  name: string;
  description: string;
  category: "batting" | "pitching" | "non_pitching";
  specRef: string; // 對應規格章節
  status: "ready" | "pending_data" | "placeholder"; // 開發狀態
  pendingNote?: string; // 待確認事項
}

// 打擊報告可選模組（規格第三節 3.0~3.7）
export const battingModules: ReportModule[] = [
  {
    id: "batting_3_0",
    name: "打擊概況摘要",
    description: "揮棒速度分佈曲線 + 層級比較摘要卡片",
    category: "batting",
    specRef: "3.0",
    status: "pending_data",
    pendingNote: "待偉丞確認層級曲線數據採集邏輯",
  },
  {
    id: "batting_3_1",
    name: "擊球仰角 / 初速趨勢圖",
    description: "區間分組長條圖 + 可切換散佈圖",
    category: "batting",
    specRef: "3.1",
    status: "pending_data",
    pendingNote: "待偉丞提供仰角區間分組定義",
  },
  {
    id: "batting_3_2",
    name: "水平角 / 初速趨勢圖",
    description: "區間分組長條圖 + 可切換散佈圖（含 Pull/Oppo 標示）",
    category: "batting",
    specRef: "3.2",
    status: "placeholder",
  },
  {
    id: "batting_3_3",
    name: "攻擊角度 / 擊球品質趨勢圖",
    description: "單一平均線趨勢圖 + 可切換散佈圖（Smash Factor）",
    category: "batting",
    specRef: "3.3",
    status: "pending_data",
    pendingNote: "待偉丞提供 Smash Factor 計算公式",
  },
  {
    id: "batting_3_4",
    name: "擊球落點與強勁程度場地圖",
    description: "扇形場地圖（D3.js + SVG）含初速門檻篩選",
    category: "batting",
    specRef: "3.4",
    status: "pending_data",
    pendingNote: "待偉丞提供場地距離數值",
  },
  {
    id: "batting_3_5",
    name: "攻擊角度 / 揮擊時間散佈圖",
    description: "基礎散佈圖（Recharts ScatterChart）",
    category: "batting",
    specRef: "3.5",
    status: "ready",
  },
  {
    id: "batting_3_6",
    name: "打擊選手個人及層級數據分佈圖",
    description: "機率分佈曲線疊加圖（KDE Curve），7 項指標可切換",
    category: "batting",
    specRef: "3.6",
    status: "pending_data",
    pendingNote: "待偉丞確認層級曲線數據採集邏輯",
  },
  {
    id: "batting_3_7",
    name: "好球帶熱區圖",
    description: "九宮格 + 外圈壞球區域熱區圖（D3.js + SVG）",
    category: "batting",
    specRef: "3.7",
    status: "placeholder",
  },
];

// 投球報告可選模組（規格第四節 4.1~4.4）
export const pitchingModules: ReportModule[] = [
  {
    id: "pitching_4_1",
    name: "投球選手個人及層級數據分佈圖",
    description: "機率分佈曲線 + 圓形時鐘圖（6 項指標 + 旋轉方向）",
    category: "pitching",
    specRef: "4.1",
    status: "pending_data",
    pendingNote: "待偉丞確認層級曲線數據邏輯",
  },
  {
    id: "pitching_4_2",
    name: "球路位移圖",
    description: "十字架座標散佈圖（D3.js + SVG）含誤差橢圓",
    category: "pitching",
    specRef: "4.2",
    status: "pending_data",
    pendingNote: "待偉丞確認誤差範圍公式",
  },
  {
    id: "pitching_4_3",
    name: "進壘點熱區圖",
    description: "九宮格 + 外圈壞球區域進壘點熱區圖（SVG）",
    category: "pitching",
    specRef: "4.3",
    status: "placeholder",
  },
  {
    id: "pitching_4_4",
    name: "出手點散佈圖",
    description: "散佈圖（Recharts），可切換軸向",
    category: "pitching",
    specRef: "4.4",
    status: "pending_data",
    pendingNote: "待偉丞確認誤差範圍公式",
  },
];

// 非投打報告模組（待偉丞提供範本後定義）
export const nonPitchingModules: ReportModule[] = [
  {
    id: "non_pitching_fitness",
    name: "體能活動度",
    description: "體能與活動度檢測數據（待定義）",
    category: "non_pitching",
    specRef: "七",
    status: "pending_data",
    pendingNote: "待偉丞提供 Word 報告範本",
  },
  {
    id: "non_pitching_mechanism",
    name: "機制檢核",
    description: "打擊 / 投球機制檢核項目（待定義）",
    category: "non_pitching",
    specRef: "十",
    status: "pending_data",
    pendingNote: "待偉丞提供範本",
  },
];

// 根據報告類型取得可用模組
export const getModulesByReportType = (
  reportType: "打擊" | "投球"
): ReportModule[] => {
  switch (reportType) {
    case "打擊":
      return battingModules;
    case "投球":
      return pitchingModules;
    default:
      return [];
  }
};

// 根據模組 ID 取得模組
export const getModuleById = (id: string): ReportModule | undefined => {
  return [...battingModules, ...pitchingModules, ...nonPitchingModules].find(
    (m) => m.id === id
  );
};
