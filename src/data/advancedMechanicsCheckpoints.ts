/**
 * 進階查核點 — 來源：AI Coach 動態捕捉資料
 *
 * 當報告使用 AI Coach 動態捕捉資料時，顯示這份按「階段 → 查核點 → 數據化區間」分組的表格，
 * 取代或補充原本的「動作機制查核」清單。
 *
 * 紅字標示為危險因子（isRisk: true）。
 */

export interface AdvancedCheckpointItem {
  /** 查核點名稱 */
  label: string;
  /** 標準範圍文字（已含單位），例如「150~180度」「75~90% 身高」 */
  range: string;
  /** 是否為危險因子（畫面以紅字呈現） */
  isRisk?: boolean;
  /** 該選手實際量到的數值（demo 假資料用，單位請含於字串） */
  value?: string;
  /** 是否在標準範圍內：true 綠、false 紅、undefined 不上色 */
  inRange?: boolean;
}

export interface AdvancedCheckpointStage {
  /** 階段名稱（如「揮臂階段」「蓄力位置」） */
  stage: string;
  items: AdvancedCheckpointItem[];
}

// ═══════════════════════════════════════
// 投手查核點
// ═══════════════════════════════════════
export const advancedPitchingCheckpoints: AdvancedCheckpointStage[] = [
  {
    stage: "揮臂階段",
    items: [
      { label: "最大肩外旋角度", range: "150~180度", isRisk: true, value: "162度", inRange: true },
      { label: "最大肩髖分離角度", range: "40~60度", value: "48度", inRange: true },
    ],
  },
  {
    stage: "前導腳落地",
    items: [
      { label: "膝屈曲角度", range: "45~60度", value: "52度", inRange: true },
      { label: "肩外展角度", range: "90度", isRisk: true, value: "84度", inRange: false },
      { label: "肩水平外展", range: "17度 ± 12度", isRisk: true, value: "20度", inRange: true },
      { label: "跨步距離", range: "75~90% 身高", value: "82% 身高", inRange: true },
    ],
  },
  {
    stage: "放球點",
    items: [
      { label: "軀幹前壓角度", range: "32~55度", value: "47度", inRange: true },
      { label: "膝屈曲角度", range: "30度", value: "33度", inRange: true },
    ],
  },
];

// ═══════════════════════════════════════
// 打擊查核點
// ═══════════════════════════════════════
export const advancedBattingCheckpoints: AdvancedCheckpointStage[] = [
  {
    stage: "蓄力位置",
    items: [
      { label: "肩/髖角度差異", range: "< 10度", value: "7度", inRange: true },
      { label: "軀幹前傾角度", range: "20~30度", value: "26度", inRange: true },
      { label: "軀幹背轉角度", range: "0~15度", value: "12度", inRange: true },
      { label: "肩膀下坡", range: "< -10度", value: "-13度", inRange: true },
    ],
  },
  {
    stage: "跨步期",
    items: [
      { label: "最大軀幹背轉角度 − 蓄力位置軀幹背轉角度", range: "10（5~15）", value: "11度", inRange: true },
      { label: "最大肩髖分離角度", range: "> 20度", value: "23度", inRange: true },
    ],
  },
  {
    stage: "前腳觸地",
    items: [
      { label: "肩膀下坡", range: "−10度", value: "-8度", inRange: false },
      { label: "軀幹前傾角度", range: "25度", value: "27度", inRange: true },
    ],
  },
];

/**
 * 判斷某次報告是否使用 AI Coach 動態捕捉（demo 邏輯）。
 * 規則：報告日期日 % 2 === 1（奇數日）視為使用了 AI Coach，方便 demo 切換。
 * 真實串接後改為從報告 metadata 取 `used_ai_coach` 旗標。
 */
export function isAICoachReport(testDate: string): boolean {
  if (!testDate) return false;
  const day = parseInt(testDate.slice(-2), 10);
  if (Number.isNaN(day)) return false;
  return day % 2 === 1;
}
