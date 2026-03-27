// Shared training data used by both Templates and Schedule pages
// public type = 訓練課程, action type = 訓練動作

// 課程顏色選項（包含是否為深色的標記）
export const courseColorOptions = [
  { value: "red", label: "紅色", color: "#EF4444", isDark: true },
  { value: "orange", label: "橘色", color: "#F97316", isDark: true },
  { value: "yellow", label: "黃色", color: "#EAB308", isDark: false },
  { value: "blue", label: "藍色", color: "#3B82F6", isDark: true },
  { value: "green", label: "綠色", color: "#22C55E", isDark: false },
];

// 驗證 Hex 色碼格式
export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
};

// 計算顏色的相對亮度（W3C 標準）
export const getRelativeLuminance = (hexColor: string): number => {
  // 移除 # 並解析 RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // 使用相對亮度公式（考量人眼對不同顏色的敏感度）
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// 取得顏色值的輔助函數（支援 preset key 與 hex 色碼）
export const getCourseColorValue = (colorKey?: string): string => {
  if (!colorKey) return courseColorOptions[0].color;
  
  // 如果是有效的 hex 色碼，直接回傳
  if (isValidHexColor(colorKey)) {
    return colorKey;
  }
  
  // 否則嘗試從預設顏色中查找
  const colorOption = courseColorOptions.find(c => c.value === colorKey);
  return colorOption?.color || courseColorOptions[0].color;
};

// 判斷課程顏色是否為深色（文字應顯示白色）
export const isCourseColorDark = (colorKey?: string): boolean => {
  if (!colorKey) return true; // 預設為深色
  
  // 先檢查是否為預設顏色 key
  const colorOption = courseColorOptions.find(c => c.value === colorKey);
  if (colorOption) {
    return colorOption.isDark;
  }
  
  // 若為 Hex 色碼，使用亮度公式動態判斷
  if (isValidHexColor(colorKey)) {
    const luminance = getRelativeLuminance(colorKey);
    return luminance <= 0.5; // 亮度 <= 0.5 為深色
  }
  
  return true; // 預設為深色
};

// ============= 檢測項目顏色配置 =============
export type TestType = "投球" | "打擊" | "體測";

export interface TestTypeColor {
  bg: string;
  text: string;
  dot: string;
}

export const testTypeColors: Record<TestType, TestTypeColor> = {
  投球: {
    bg: "bg-primary/15",
    text: "text-primary",
    dot: "fill-primary",
  },
  打擊: {
    bg: "bg-[#73AB84]/15",
    text: "text-[#73AB84]",
    dot: "fill-[#73AB84]",
  },
  體測: {
    bg: "bg-accent",
    text: "text-muted-foreground",
    dot: "fill-muted-foreground",
  },
};

// 取得檢測項目顏色的輔助函數
export const getTestTypeColor = (type: string): TestTypeColor => {
  return testTypeColors[type as TestType] || testTypeColors["體測"];
};

// 訓練課程介面
export interface CourseItem {
  id: string;
  name: string;
  category: string;
  actionIds: string[]; // 動作 ID 清單
  notes?: string; // 備註
  color?: string; // 代表顏色 key
  updatedAt: string;
  type: "public";
}

// 動作分類類型
export type ActionCategory = "打擊" | "投球" | "非投打";

// 訓練動作介面
export interface ActionItem {
  id: string;
  name: string;
  category: string; // 用於分類列表顯示
  actionCategory: ActionCategory; // 動作分類：打擊 / 投球 / 非投打
  bat?: string; // 球棒（僅打擊時顯示）
  scenario?: string; // 情境（僅打擊時顯示）
  ball?: string; // 球（僅投球時顯示）
  equipment?: string; // 輔具
  sets: number; // 組數 1-10
  reps: number; // 次數 1-10
  intensity: number; // 強度 0-100
  notes?: string; // 備注
  videoUrl?: string; // 影片連結
  updatedAt: string;
  type: "action";
}

// 個人範本介面（用於課表管理）
export interface PersonalTemplateItem {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
  type: "personal";
}

// 統一的項目類型
export type TemplateItem = CourseItem | ActionItem | PersonalTemplateItem;

// 組數/次數選項
export const setsOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export const repsOptions = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

// 強度選項（0-100，間隔 5）
export const intensityOptions = Array.from({ length: 21 }, (_, i) => ({
  value: String(i * 5),
  label: `${i * 5}%`,
}));

// 動作分類選項
export const actionCategoryOptions: { value: ActionCategory; label: string }[] = [
  { value: "打擊", label: "打擊" },
  { value: "投球", label: "投球" },
  { value: "非投打", label: "非投打" },
];

// 球棒選項
export const batOptions = [
  { value: "木棒", label: "木棒" },
  { value: "鋁棒", label: "鋁棒" },
  { value: "加重棒(綠)", label: "加重棒(綠)" },
  { value: "加重棒(紅)", label: "加重棒(紅)" },
  { value: "短棒", label: "短棒" },
  { value: "長棒", label: "長棒" },
  { value: "減輕棒", label: "減輕棒" },
];

// 投球用球選項
export const ballOptions = [
  { value: "1500g", label: "1500g" },
  { value: "1000g", label: "1000g" },
  { value: "450g", label: "450g" },
  { value: "225g", label: "225g" },
  { value: "150g", label: "150g" },
  { value: "100g", label: "100g" },
  { value: "7oz", label: "7oz" },
  { value: "6oz", label: "6oz" },
  { value: "5oz", label: "5oz" },
  { value: "4oz", label: "4oz" },
  { value: "3oz", label: "3oz" },
];

// 打擊情境選項
export const scenarioOptions = [
  { value: "T座", label: "T座" },
  { value: "拋打", label: "拋打" },
  { value: "上手餵球", label: "上手餵球" },
  { value: "發球機直球", label: "發球機直球" },
  { value: "發球機變化球", label: "發球機變化球" },
  { value: "發球機混合球種", label: "發球機混合球種" },
  { value: "實戰", label: "實戰" },
];

// 輔具選項
export const equipmentOptions = [
  { value: "無", label: "無" },
  { value: "打擊座", label: "打擊座" },
  { value: "發球機", label: "發球機" },
  { value: "彈力帶", label: "彈力帶" },
  { value: "啞鈴", label: "啞鈴" },
  { value: "藥球", label: "藥球" },
  { value: "沙袋", label: "沙袋" },
  { value: "加重球", label: "加重球" },
];

// 訓練課程資料
export const coursesData: CourseItem[] = [
  {
    id: "c1",
    name: "基礎體能課程",
    category: "基礎訓練",
    actionIds: ["a3", "a6", "a16", "a23", "a30"],
    notes: "適合新手入門的基礎體能訓練",
    color: "primary",
    updatedAt: "2025-01-20",
    type: "public",
  },
  {
    id: "c2",
    name: "投手專項課程",
    category: "專項訓練",
    actionIds: ["a1", "a7", "a12", "a15", "a21", "a28"],
    notes: "針對投手的專項投球訓練",
    color: "green-dark",
    updatedAt: "2025-01-20",
    type: "public",
  },
  {
    id: "c3",
    name: "打擊專項課程",
    category: "專項訓練",
    actionIds: ["a2", "a5", "a11", "a13", "a14", "a25"],
    notes: "提升打擊能力的專項訓練",
    color: "teal",
    updatedAt: "2025-01-19",
    type: "public",
  },
  {
    id: "c4",
    name: "核心肌群訓練",
    category: "體能訓練",
    actionIds: ["a8", "a17", "a27"],
    notes: "強化核心穩定性與爆發力",
    color: "dark",
    updatedAt: "2025-01-19",
    type: "public",
  },
  {
    id: "c5",
    name: "下肢爆發力訓練",
    category: "體能訓練",
    actionIds: ["a9", "a16", "a20", "a26", "a29"],
    notes: "提升下肢力量與爆發力",
    color: "green-light",
    updatedAt: "2025-01-18",
    type: "public",
  },
  {
    id: "c6",
    name: "投手熱身課程",
    category: "基礎訓練",
    actionIds: ["a3", "a23", "a1"],
    notes: "投手賽前熱身專用",
    color: "teal-light",
    updatedAt: "2025-01-18",
    type: "public",
  },
  {
    id: "c7",
    name: "打擊熱身課程",
    category: "基礎訓練",
    actionIds: ["a2", "a19", "a22"],
    notes: "打者賽前熱身專用",
    color: "default",
    updatedAt: "2025-01-17",
    type: "public",
  },
  {
    id: "c8",
    name: "變化球進階訓練",
    category: "進階訓練",
    actionIds: ["a7", "a12", "a15", "a21", "a28"],
    notes: "各類變化球的進階控球訓練",
    color: "green-dark",
    updatedAt: "2025-01-17",
    type: "public",
  },
  {
    id: "c9",
    name: "實戰打擊模擬",
    category: "模擬比賽",
    actionIds: ["a5", "a13", "a25"],
    notes: "模擬實戰球速與落點的打擊訓練",
    color: "primary",
    updatedAt: "2025-01-16",
    type: "public",
  },
  {
    id: "c10",
    name: "肩部保養課程",
    category: "基礎訓練",
    actionIds: ["a3", "a23", "a6"],
    notes: "投手肩部保養與預防受傷",
    color: "teal",
    updatedAt: "2025-01-16",
    type: "public",
  },
  {
    id: "c11",
    name: "加重訓練課程",
    category: "專項訓練",
    actionIds: ["a4", "a11", "a18", "a24"],
    notes: "使用加重器材強化肌力",
    color: "dark",
    updatedAt: "2025-01-15",
    type: "public",
  },
  {
    id: "c12",
    name: "全方位打擊課程",
    category: "專項訓練",
    actionIds: ["a2", "a19", "a22", "a5", "a13", "a14", "a25"],
    notes: "涵蓋各種球路與位置的打擊訓練",
    color: "green-light",
    updatedAt: "2025-01-15",
    type: "public",
  },
  {
    id: "c13",
    name: "速度與敏捷訓練",
    category: "體能訓練",
    actionIds: ["a20", "a9", "a29"],
    notes: "提升跑壘與守備的速度敏捷性",
    color: "teal-light",
    updatedAt: "2025-01-14",
    type: "public",
  },
  {
    id: "c14",
    name: "投手牛棚練習",
    category: "模擬比賽",
    actionIds: ["a1", "a7", "a12", "a21"],
    notes: "模擬比賽情境的牛棚投球訓練",
    color: "default",
    updatedAt: "2025-01-14",
    type: "public",
  },
  {
    id: "c15",
    name: "恢復日訓練",
    category: "基礎訓練",
    actionIds: ["a3", "a23", "a30"],
    notes: "賽後或高強度訓練後的恢復課程",
    color: "teal",
    updatedAt: "2025-01-13",
    type: "public",
  },
];

// 訓練動作資料
export const actionsData: ActionItem[] = [
  {
    id: "a1",
    name: "直球精準度訓練",
    category: "基礎訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 3,
    reps: 15,
    intensity: 70,
    notes: "投向捕手手套中心",
    videoUrl: "https://example.com/v1",
    updatedAt: "2025-01-20",
    type: "action",
  },
  {
    id: "a2",
    name: "打擊座定點揮擊",
    category: "基礎訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "打擊座",
    sets: 5,
    reps: 20,
    intensity: 50,
    notes: "調整揮棒水平軌跡",
    videoUrl: "https://example.com/v2",
    updatedAt: "2025-01-20",
    type: "action",
  },
  {
    id: "a3",
    name: "肩部彈力帶旋轉",
    category: "基礎訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "彈力帶",
    sets: 2,
    reps: 15,
    intensity: 30,
    notes: "啟動旋轉肌群",
    videoUrl: "https://example.com/v3",
    updatedAt: "2025-01-20",
    type: "action",
  },
  {
    id: "a4",
    name: "加重球牆面推擲",
    category: "專項訓練",
    actionCategory: "投球",
    bat: "鋁棒",
    equipment: "加重球",
    sets: 4,
    reps: 10,
    intensity: 80,
    notes: "強化放球爆發力",
    videoUrl: "https://example.com/v4",
    updatedAt: "2025-01-19",
    type: "action",
  },
  {
    id: "a5",
    name: "發球機快速球對抗",
    category: "進階訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "發球機",
    sets: 5,
    reps: 12,
    intensity: 90,
    notes: "模擬實戰球速",
    videoUrl: "https://example.com/v5",
    updatedAt: "2025-01-19",
    type: "action",
  },
  {
    id: "a6",
    name: "啞鈴側平舉",
    category: "基礎訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "啞鈴",
    sets: 3,
    reps: 12,
    intensity: 65,
    notes: "強化三角肌中束",
    videoUrl: "https://example.com/v6",
    updatedAt: "2025-01-19",
    type: "action",
  },
  {
    id: "a7",
    name: "變速球控球練習",
    category: "進階訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 3,
    reps: 20,
    intensity: 60,
    notes: "練習手指離球感",
    videoUrl: "https://example.com/v7",
    updatedAt: "2025-01-18",
    type: "action",
  },
  {
    id: "a8",
    name: "藥球旋轉投擲",
    category: "專項訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "藥球",
    sets: 4,
    reps: 8,
    intensity: 85,
    notes: "核心抗旋轉與爆發",
    videoUrl: "https://example.com/v8",
    updatedAt: "2025-01-18",
    type: "action",
  },
  {
    id: "a9",
    name: "沙袋側向登階",
    category: "專項訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "沙袋",
    sets: 4,
    reps: 12,
    intensity: 75,
    notes: "提升下肢橫向穩定",
    videoUrl: "https://example.com/v9",
    updatedAt: "2025-01-18",
    type: "action",
  },
  {
    id: "a10",
    name: "長距離傳接球",
    category: "基礎訓練",
    actionCategory: "投球",
    bat: "鋁棒",
    equipment: "無",
    sets: 2,
    reps: 25,
    intensity: 60,
    notes: "增加傳球臂力",
    videoUrl: "https://example.com/v10",
    updatedAt: "2025-01-17",
    type: "action",
  },
  {
    id: "a11",
    name: "加重棒揮擊訓練",
    category: "進階訓練",
    actionCategory: "打擊",
    bat: "加重棒",
    equipment: "無",
    sets: 4,
    reps: 10,
    intensity: 85,
    notes: "提升揮棒負重能力",
    videoUrl: "https://example.com/v11",
    updatedAt: "2025-01-17",
    type: "action",
  },
  {
    id: "a12",
    name: "曲球轉速強化",
    category: "進階訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 4,
    reps: 12,
    intensity: 75,
    notes: "練習下壓轉速",
    videoUrl: "https://example.com/v12",
    updatedAt: "2025-01-17",
    type: "action",
  },
  {
    id: "a13",
    name: "發球機變化球訓練",
    category: "進階訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "發球機",
    sets: 4,
    reps: 15,
    intensity: 80,
    notes: "練習判斷落點",
    videoUrl: "https://example.com/v13",
    updatedAt: "2025-01-16",
    type: "action",
  },
  {
    id: "a14",
    name: "彈力帶抗阻揮棒",
    category: "專項訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "彈力帶",
    sets: 3,
    reps: 10,
    intensity: 70,
    notes: "強化啟動速度",
    videoUrl: "https://example.com/v14",
    updatedAt: "2025-01-16",
    type: "action",
  },
  {
    id: "a15",
    name: "滑球位移修正",
    category: "專項訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 5,
    reps: 12,
    intensity: 80,
    notes: "修正放球扣球角度",
    videoUrl: "https://example.com/v15",
    updatedAt: "2025-01-16",
    type: "action",
  },
  {
    id: "a16",
    name: "啞鈴負重深蹲",
    category: "基礎訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "啞鈴",
    sets: 3,
    reps: 15,
    intensity: 70,
    notes: "強化下肢基礎",
    videoUrl: "https://example.com/v16",
    updatedAt: "2025-01-15",
    type: "action",
  },
  {
    id: "a17",
    name: "藥球過頭拋擲",
    category: "專項訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "藥球",
    sets: 3,
    reps: 10,
    intensity: 90,
    notes: "訓練全身協調出力",
    videoUrl: "https://example.com/v17",
    updatedAt: "2025-01-15",
    type: "action",
  },
  {
    id: "a18",
    name: "加重球指力訓練",
    category: "專項訓練",
    actionCategory: "投球",
    bat: "鋁棒",
    equipment: "加重球",
    sets: 3,
    reps: 20,
    intensity: 55,
    notes: "提升指尖控球感",
    videoUrl: "https://example.com/v18",
    updatedAt: "2025-01-15",
    type: "action",
  },
  {
    id: "a19",
    name: "打擊座高球練習",
    category: "基礎訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "打擊座",
    sets: 4,
    reps: 15,
    intensity: 60,
    notes: "修正高角度揮棒",
    videoUrl: "https://example.com/v19",
    updatedAt: "2025-01-14",
    type: "action",
  },
  {
    id: "a20",
    name: "沙袋負重衝刺",
    category: "進階訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "沙袋",
    sets: 4,
    reps: 6,
    intensity: 95,
    notes: "強化起跑爆發力",
    videoUrl: "https://example.com/v20",
    updatedAt: "2025-01-14",
    type: "action",
  },
  {
    id: "a21",
    name: "伸卡球控制",
    category: "進階訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 3,
    reps: 15,
    intensity: 75,
    notes: "練習球尾勁下沉",
    videoUrl: "https://example.com/v21",
    updatedAt: "2025-01-14",
    type: "action",
  },
  {
    id: "a22",
    name: "打擊座低球練習",
    category: "基礎訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "打擊座",
    sets: 4,
    reps: 15,
    intensity: 60,
    notes: "練習撈擊技巧",
    videoUrl: "https://example.com/v22",
    updatedAt: "2025-01-13",
    type: "action",
  },
  {
    id: "a23",
    name: "彈力帶肩後拉",
    category: "基礎訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "彈力帶",
    sets: 3,
    reps: 20,
    intensity: 40,
    notes: "預防投手肩受傷",
    videoUrl: "https://example.com/v23",
    updatedAt: "2025-01-13",
    type: "action",
  },
  {
    id: "a24",
    name: "加重球平推",
    category: "專項訓練",
    actionCategory: "投球",
    bat: "鋁棒",
    equipment: "加重球",
    sets: 3,
    reps: 12,
    intensity: 70,
    notes: "強化出手延伸",
    videoUrl: "https://example.com/v24",
    updatedAt: "2025-01-13",
    type: "action",
  },
  {
    id: "a25",
    name: "發球機內角球",
    category: "專項訓練",
    actionCategory: "打擊",
    bat: "無",
    equipment: "發球機",
    sets: 5,
    reps: 10,
    intensity: 85,
    notes: "練習收肘打擊",
    videoUrl: "https://example.com/v25",
    updatedAt: "2025-01-12",
    type: "action",
  },
  {
    id: "a26",
    name: "啞鈴分腿蹲",
    category: "進階訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "啞鈴",
    sets: 3,
    reps: 10,
    intensity: 80,
    notes: "強化單腳支撐平衡",
    videoUrl: "https://example.com/v26",
    updatedAt: "2025-01-12",
    type: "action",
  },
  {
    id: "a27",
    name: "藥球側拋練習",
    category: "專項訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "藥球",
    sets: 3,
    reps: 12,
    intensity: 75,
    notes: "模擬打擊核心轉動",
    videoUrl: "https://example.com/v27",
    updatedAt: "2025-01-12",
    type: "action",
  },
  {
    id: "a28",
    name: "指叉球下墜練習",
    category: "進階訓練",
    actionCategory: "投球",
    bat: "木棒",
    equipment: "無",
    sets: 4,
    reps: 10,
    intensity: 75,
    notes: "練習放球點穩定度",
    videoUrl: "https://example.com/v28",
    updatedAt: "2025-01-11",
    type: "action",
  },
  {
    id: "a29",
    name: "沙袋負重跳躍",
    category: "進階訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "沙袋",
    sets: 4,
    reps: 8,
    intensity: 90,
    notes: "提升垂直跳躍力",
    videoUrl: "https://example.com/v29",
    updatedAt: "2025-01-11",
    type: "action",
  },
  {
    id: "a30",
    name: "彈力帶胸前推",
    category: "基礎訓練",
    actionCategory: "非投打",
    bat: "無",
    equipment: "彈力帶",
    sets: 3,
    reps: 15,
    intensity: 50,
    notes: "強化推蹬連動感",
    videoUrl: "https://example.com/v30",
    updatedAt: "2025-01-11",
    type: "action",
  },
];

// 個人範本資料（用於課表管理）
export const personalTemplatesData: PersonalTemplateItem[] = [
  { id: "p1", name: "我的打擊菜單", category: "打擊", updatedAt: "2025-01-18", type: "personal" },
  { id: "p2", name: "投球熱身組合", category: "投球", updatedAt: "2025-01-17", type: "personal" },
  { id: "p3", name: "賽前準備", category: "綜合", updatedAt: "2025-01-16", type: "personal" },
  { id: "p4", name: "恢復日課表", category: "體能", updatedAt: "2025-01-15", type: "personal" },
  { id: "p5", name: "週末加練", category: "綜合", updatedAt: "2025-01-14", type: "personal" },
];

// 合併課程和動作資料供範本管理使用
export const templatesData: TemplateItem[] = [...coursesData, ...actionsData];

// Helper function to group courses by category for Schedule page (公用訓練)
export function getCoursesByCategory() {
  const categoryMap = new Map<string, string[]>();

  coursesData.forEach((course) => {
    const items = categoryMap.get(course.category) || [];
    items.push(course.name);
    categoryMap.set(course.category, items);
  });

  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

// Helper function to group personal templates by category for Schedule page (個人訓練)
export function getPersonalTemplatesByCategory() {
  const categoryMap = new Map<string, string[]>();

  personalTemplatesData.forEach((template) => {
    const items = categoryMap.get(template.category) || [];
    items.push(template.name);
    categoryMap.set(template.category, items);
  });

  return Array.from(categoryMap.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

// Get unique categories by type (for Templates page)
export function getCategories(type?: "public" | "action") {
  if (type === "public") {
    return [...new Set(coursesData.map((c) => c.category))];
  }
  if (type === "action") {
    return [...new Set(actionsData.map((a) => a.category))];
  }
  return [...new Set(templatesData.map((t) => t.category))];
}

// Get courses only
export function getCourses() {
  return coursesData;
}

// Get actions only
export function getActions() {
  return actionsData;
}
