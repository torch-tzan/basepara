/**
 * 集中管理所有檢測指標的 metadata（label, unit, decimals, reversed 等）。
 * 此檔案是「層級比較」頁面的指標來源，不含數值——值由 useComparisonData hook 負責。
 * 現有各 Section 元件保留自己的 mock data 不受影響。
 */

export interface MetricDefinition {
  /** 唯一 key，格式: group_camelCase */
  key: string;
  /** 中文名稱 */
  label: string;
  /** 單位 */
  unit?: string;
  /** 小數位數 */
  decimals?: number;
  /** 是否反向（越低越好，如體脂率、觸地時間） */
  reversed?: boolean;
  /** 計算公式說明 */
  formula?: string;
  /** 後端資料來源欄位 */
  dataSource?: string;
  /** OK 區間 [min, max] */
  okRange?: [number, number];
  /** 是否顯示 mean±SD（個人報告中使用） */
  showSD?: boolean;
  /** 指標分組 */
  group: "fitness" | "swing" | "hitting" | "pitch" | "arm";
}

// ═══════════════════════════════════════
// 身體素質 (13 項) — from FitnessSection
// ═══════════════════════════════════════
const fitnessMetrics: MetricDefinition[] = [
  { key: "fitness_netWeight", label: "淨體重", unit: "kg", decimals: 1, group: "fitness", formula: "Weight × (1 - BodyFat)", dataSource: "Weight, BodyFat" },
  { key: "fitness_skeletalMuscle", label: "骨骼肌重", unit: "kg", decimals: 1, group: "fitness", dataSource: "SkeletalMuscleMass" },
  { key: "fitness_bodyFat", label: "體脂率", unit: "%", decimals: 1, reversed: true, group: "fitness", dataSource: "BodyFat" },
  { key: "fitness_cmjHeight", label: "反向跳 跳躍高度", unit: "cm", decimals: 1, group: "fitness", dataSource: "CMJ_Height" },
  { key: "fitness_djRSI", label: "落下跳 反應肌力", decimals: 2, group: "fitness", dataSource: "DJ_RSI" },
  { key: "fitness_djContact", label: "落下跳 觸地時間", unit: "s", decimals: 2, reversed: true, group: "fitness", dataSource: "DJ_ContactTime" },
  { key: "fitness_medballDom", label: "藥球側拋 慣用手", unit: "kph", decimals: 1, group: "fitness", dataSource: "MedBall (慣用側)" },
  { key: "fitness_medballNon", label: "藥球側拋 非慣用手", unit: "kph", decimals: 1, group: "fitness", dataSource: "MedBall (非慣用側)" },
  { key: "fitness_gripDom", label: "握力 慣用手", unit: "kg", decimals: 1, group: "fitness", dataSource: "GripStrength (慣用側)" },
  { key: "fitness_gripNon", label: "握力 非慣用手", unit: "kg", decimals: 1, group: "fitness", dataSource: "GripStrength (非慣用側)" },
  { key: "fitness_pullUp", label: "引體向上", unit: "次", decimals: 0, group: "fitness", dataSource: "PullUp" },
  { key: "fitness_sprintTotal", label: "衝刺 總完成時間", unit: "s", decimals: 3, reversed: true, group: "fitness", dataSource: "Sprint_TotalTime" },
  { key: "fitness_sprintSeg1", label: "衝刺 分段一完成時間", unit: "s", decimals: 3, reversed: true, group: "fitness", dataSource: "Sprint_Seg1Time" },
];

// ═══════════════════════════════════════
// 揮棒數據 (10 項) — from SwingDataSection
// ═══════════════════════════════════════
const swingMetrics: MetricDefinition[] = [
  { key: "swing_avgBatSpeed", label: "平均 揮棒速度", unit: "km/h", decimals: 1, showSD: true, group: "swing", dataSource: "BatSpeed" },
  { key: "swing_maxBatSpeed", label: "最高 揮棒速度", unit: "km/h", decimals: 1, group: "swing", dataSource: "MAX(BatSpeed)" },
  { key: "swing_batSpeedRatio", label: "平均/最高 揮棒速度 比值", decimals: 3, group: "swing", formula: "AVG(BatSpeed) / MAX(BatSpeed)" },
  { key: "swing_peakHandSpeed", label: "平均 峰值手腕速度", unit: "km/h", decimals: 1, group: "swing", dataSource: "PeakHandSpeed" },
  { key: "swing_effectiveAttackPct", label: "有效攻擊角度比例", unit: "%", decimals: 1, group: "swing", formula: "COUNT(AttackAngle∈[5°,20°]) / COUNT(*)", dataSource: "AttackAngle" },
  { key: "swing_avgAttackAngle", label: "平均 攻擊角度", unit: "°", decimals: 1, showSD: true, group: "swing", okRange: [5, 20], dataSource: "AttackAngle" },
  { key: "swing_timeToContact", label: "平均 揮擊時間", unit: "s", decimals: 3, reversed: true, group: "swing", dataSource: "TimeToContact" },
  { key: "swing_connectionDiff", label: "平均 連結性差異", decimals: 1, reversed: true, group: "swing", formula: "EarlyConnection − ConnectionAtImpact", dataSource: "EarlyConnection, ConnectionAtImpact" },
  { key: "swing_vertBatAngle", label: "平均 球棒垂直角度", unit: "°", decimals: 1, group: "swing", dataSource: "VerticalBatAngle" },
  { key: "swing_onPlaneEff", label: "平均 平面重和率", unit: "%", decimals: 1, group: "swing", dataSource: "OnPlaneEfficiency" },
];

// ═══════════════════════════════════════
// 擊球數據 (11 項) — from HittingDataSection
// ═══════════════════════════════════════
const hittingMetrics: MetricDefinition[] = [
  { key: "hitting_maxExitVelo", label: "最高 擊球初速", unit: "km/h", decimals: 1, group: "hitting", dataSource: "MAX(ExitVelocity)" },
  { key: "hitting_avgExitVelo", label: "平均 擊球初速", unit: "km/h", decimals: 1, showSD: true, group: "hitting", dataSource: "ExitVelocity" },
  { key: "hitting_avgLaunchAngle", label: "平均 擊球仰角", unit: "°", decimals: 1, showSD: true, group: "hitting", okRange: [10, 25], dataSource: "LaunchAngle" },
  { key: "hitting_hardHitLA", label: "強擊球 擊球仰角", unit: "°", decimals: 1, group: "hitting", formula: "強擊球：顆數<10 取 top5、>50 取 top10%；取該範圍 LaunchAngle 平均", dataSource: "LaunchAngle" },
  { key: "hitting_effectiveLAPct", label: "有效擊球仰角比例", unit: "%", decimals: 1, group: "hitting", formula: "初速≥150：LaunchAngle∈[10°,30°]；初速<150：[5°,25°]" },
  { key: "hitting_pullCenterPushLA", label: "拉/中/推 平均仰角", unit: "°", decimals: 1, group: "hitting", formula: "拉打 HorizontalAngle<-10°、中間 ±10°、推打 >10°，分別取 LaunchAngle 平均" },
  { key: "hitting_avgHorizAngle", label: "平均 擊球水平角", unit: "°", decimals: 1, group: "hitting", dataSource: "HorizontalAngle" },
  { key: "hitting_hardHitHorizAngle", label: "強擊球 擊球水平角", unit: "°", decimals: 1, group: "hitting", formula: "同強擊球定義，取 HorizontalAngle 平均" },
  { key: "hitting_avgDistance", label: "平均飛行距離", unit: "m", decimals: 1, group: "hitting", dataSource: "Distance" },
  { key: "hitting_hardHitDistance", label: "強擊球 飛行距離", unit: "m", decimals: 1, group: "hitting", formula: "同強擊球定義，取 Distance 平均" },
  { key: "hitting_collisionEff", label: "碰撞效率", decimals: 2, group: "hitting", formula: "ExitVelocity / PitchSpeed", dataSource: "ExitVelocity, PitchSpeed" },
];

// ═══════════════════════════════════════
// 球種數據 (12 項) — from PitchTypeSection
// ═══════════════════════════════════════
const pitchMetrics: MetricDefinition[] = [
  { key: "pitch_velo", label: "球速", unit: "kph", decimals: 1, group: "pitch", dataSource: "Velo_Rapsodo" },
  { key: "pitch_spinDir", label: "旋轉方向", group: "pitch", dataSource: "SpinDirection" },
  { key: "pitch_spinEff", label: "旋轉效率", unit: "%", decimals: 1, group: "pitch", dataSource: "SpinEfficiency" },
  { key: "pitch_gyroDeg", label: "陀螺角度", unit: "°", decimals: 1, group: "pitch", dataSource: "GyroDegree" },
  { key: "pitch_totalSpin", label: "轉速", unit: "rpm", decimals: 0, showSD: true, group: "pitch", dataSource: "TotalSpin" },
  { key: "pitch_vertBreak", label: "垂直位移", unit: "cm", decimals: 1, showSD: true, group: "pitch", dataSource: "VerticalBreak" },
  { key: "pitch_horizBreak", label: "水平位移", unit: "cm", decimals: 1, showSD: true, group: "pitch", dataSource: "HorizontalBreak" },
  { key: "pitch_extension", label: "出手延伸", unit: "cm", decimals: 1, group: "pitch", dataSource: "ReleaseExtension" },
  { key: "pitch_releaseH", label: "出手高度", unit: "cm", decimals: 1, group: "pitch", dataSource: "ReleaseHeight" },
  { key: "pitch_releaseSide", label: "出手側向", unit: "cm", decimals: 1, group: "pitch", dataSource: "ReleaseSide" },
  { key: "pitch_vaa", label: "垂直進壘角度", unit: "°", decimals: 1, group: "pitch", dataSource: "VAA" },
  { key: "pitch_haa", label: "水平進壘角度", unit: "°", decimals: 1, group: "pitch", dataSource: "HAA" },
];

// ═══════════════════════════════════════
// 揮臂數據 (4 項) — from PitchTypeSection
// ═══════════════════════════════════════
const armMetrics: MetricDefinition[] = [
  { key: "arm_armSpeed", label: "揮臂速度", unit: "°/s", decimals: 0, group: "arm", dataSource: "ArmSpeed" },
  { key: "arm_releaseAngle", label: "出手角度", unit: "°", decimals: 1, group: "arm", dataSource: "ReleaseAngle" },
  { key: "arm_elbowTorque", label: "手肘外翻應力", unit: "Nm", decimals: 1, group: "arm", dataSource: "ElbowTorque" },
  { key: "arm_pitchEfficiency", label: "投球效率", decimals: 2, group: "arm", formula: "Velo_Rapsodo / ElbowTorque（球速 ÷ 外翻應力）", dataSource: "Velo_Rapsodo, ElbowTorque" },
];

// ═══════════════════════════════════════
// 全部指標合併
// ═══════════════════════════════════════
export const metricDefinitions: MetricDefinition[] = [
  ...fitnessMetrics,
  ...swingMetrics,
  ...hittingMetrics,
  ...pitchMetrics,
  ...armMetrics,
];

// ═══════════════════════════════════════
// Helper accessors
// ═══════════════════════════════════════
export const getFitnessMetrics = () => fitnessMetrics;
export const getSwingMetrics = () => swingMetrics;
export const getHittingMetrics = () => hittingMetrics;
export const getPitchMetrics = () => pitchMetrics;
export const getArmMetrics = () => armMetrics;

export type ComparisonType = "投球" | "打擊" | "身體素質";

/**
 * 依比較類型取得對應的指標群組：
 * - 身體素質 → fitness
 * - 打擊 → swing + hitting
 * - 投球 → pitch + arm
 */
export const getMetricGroupsByComparisonType = (
  type: ComparisonType
): { title: string; metrics: MetricDefinition[] }[] => {
  switch (type) {
    case "身體素質":
      return [{ title: "身體素質", metrics: fitnessMetrics }];
    case "打擊":
      return [
        { title: "揮棒數據", metrics: swingMetrics },
        { title: "擊球數據", metrics: hittingMetrics },
      ];
    case "投球":
      return [
        { title: "球種數據", metrics: pitchMetrics },
        { title: "揮臂數據", metrics: armMetrics },
      ];
  }
};
