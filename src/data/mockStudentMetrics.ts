/**
 * 為 6 個學員生成各自不同的 mock 檢測數據。
 * 各 Section 元件透過 studentId 查找對應數據。
 * 未來接真實資料時，此檔案可整個移除。
 */

import type { MetricRow } from "@/components/reports/DataTable";

// ═══════════════════════════════════════
// 確定性隨機（同 studentId 每次算出相同值）
// ═══════════════════════════════════════
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 在 base 值附近 ±pct 偏移 */
function vary(rand: () => number, base: number, pct = 0.15): number {
  return base * (1 + (rand() - 0.5) * 2 * pct);
}

/** 四捨五入到指定小數位 */
function round(v: number, d: number): number {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}

// ═══════════════════════════════════════
// 六位學員的人設基底
// ═══════════════════════════════════════
// 每位學員有不同的體型/特性，讓數據有差異感
interface PlayerProfile {
  // 身體素質基底倍率
  power: number;   // 爆發力（影響跳躍、藥球、握力）
  speed: number;   // 速度（影響揮棒速度、觸地時間）
  size: number;    // 體型（影響體重、骨骼肌）
  fat: number;     // 體脂傾向
  // 打擊特性
  batSpeed: number;
  exitVelo: number;
  launchAngle: number; // 偏高或偏低
  // 投球特性
  pitchVelo: number;
  spinRate: number;
}

const PROFILES: Record<string, PlayerProfile> = {
  "1": { power: 1.05, speed: 1.08, size: 1.0, fat: 0.9,  batSpeed: 1.06, exitVelo: 1.08, launchAngle: 0.95, pitchVelo: 1.10, spinRate: 1.05 }, // 王維中：投手，速度型
  "2": { power: 1.10, speed: 0.95, size: 0.95, fat: 1.0, batSpeed: 0.98, exitVelo: 1.02, launchAngle: 1.10, pitchVelo: 0.95, spinRate: 1.08 }, // 李明軒：捕手，穩定型
  "3": { power: 0.90, speed: 1.12, size: 0.88, fat: 0.85, batSpeed: 1.10, exitVelo: 0.95, launchAngle: 0.88, pitchVelo: 0.92, spinRate: 0.95 }, // 張佳豪：內野手，敏捷型
  "4": { power: 1.15, speed: 1.00, size: 1.08, fat: 1.05, batSpeed: 1.02, exitVelo: 1.12, launchAngle: 1.05, pitchVelo: 0.98, spinRate: 1.00 }, // 陳志偉：外野手，強打型
  "5": { power: 1.00, speed: 1.05, size: 1.05, fat: 0.95, batSpeed: 0.95, exitVelo: 0.98, launchAngle: 1.00, pitchVelo: 1.08, spinRate: 1.12 }, // 林宇翔：左投，技巧型
  "6": { power: 0.85, speed: 1.02, size: 0.82, fat: 0.88, batSpeed: 0.92, exitVelo: 0.88, launchAngle: 1.15, pitchVelo: 0.88, spinRate: 0.90 }, // 黃建華：內野手，小個子速度型
};

const DEFAULT_PROFILE: PlayerProfile = { power: 1.0, speed: 1.0, size: 1.0, fat: 1.0, batSpeed: 1.0, exitVelo: 1.0, launchAngle: 1.0, pitchVelo: 1.0, spinRate: 1.0 };

function getProfile(studentId: string): PlayerProfile {
  return PROFILES[studentId] || DEFAULT_PROFILE;
}

// ═══════════════════════════════════════
// Fitness mock data generator
// ═══════════════════════════════════════
export function getFitnessMockRows(studentId: string): MetricRow[] {
  const p = getProfile(studentId);
  const r = seededRandom(hashCode(`fitness_${studentId}`));

  const netWeight = round(vary(r, 68.5 * p.size, 0.08), 1);
  const skeletal = round(vary(r, 32.1 * p.size * p.power, 0.08), 1);
  const bodyFat = round(vary(r, 14.2 * p.fat, 0.12), 1);
  const cmj = round(vary(r, 42.5 * p.power, 0.10), 1);
  const djRSI = round(vary(r, 1.35 * p.power * p.speed, 0.10), 2);
  const djContact = round(vary(r, 0.28 / p.speed, 0.08), 2);
  const medDom = round(vary(r, 52.3 * p.power, 0.10), 1);
  const medNon = round(vary(r, 48.7 * p.power * 0.95, 0.10), 1);
  const gripDom = round(vary(r, 42.0 * p.power * p.size, 0.10), 1);
  const gripNon = round(vary(r, 39.5 * p.power * p.size, 0.10), 1);
  const pullUp = Math.round(vary(r, 8 * p.power, 0.20));
  // 衝刺：時間越短越好，速度高的學員時間短
  const sprintTotal = round(vary(r, 1.635 / p.speed, 0.06), 3);
  const sprintSeg1 = round(vary(r, 4.825 / p.speed, 0.05), 3);

  // 前次數據（略低，模擬進步）
  const prev = (v: number, d: number) => round(v * vary(r, 0.97, 0.02), d);
  const prev2 = (v: number, d: number) => round(v * vary(r, 0.94, 0.02), d);
  // 衝刺前次數據（時間 reversed，前次應較長）
  const prevTime = (v: number, d: number) => round(v * vary(r, 1.03, 0.02), d);
  const prev2Time = (v: number, d: number) => round(v * vary(r, 1.06, 0.02), d);

  return [
    { label: "淨體重", unit: "kg", value: netWeight, previousValues: [prev(netWeight, 1), prev2(netWeight, 1)], levelAvg: 65.0, levelSD: 8.0, decimals: 1 },
    { label: "骨骼肌重", unit: "kg", value: skeletal, previousValues: [prev(skeletal, 1), prev2(skeletal, 1)], levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
    { label: "體脂率", unit: "%", value: bodyFat, previousValues: [round(bodyFat * vary(r, 1.05, 0.02), 1), round(bodyFat * vary(r, 1.10, 0.02), 1)], levelAvg: 16.0, levelSD: 4.0, decimals: 1, reversed: true },
    { label: "反向跳 跳躍高度", unit: "cm", value: cmj, previousValues: [prev(cmj, 1), prev2(cmj, 1)], levelAvg: 38.0, levelSD: 6.0, decimals: 1, showPR: true },
    { label: "落下跳 反應肌力", value: djRSI, previousValues: [prev(djRSI, 2), prev2(djRSI, 2)], levelAvg: 1.20, levelSD: 0.30, decimals: 2, showPR: true },
    { label: "落下跳 觸地時間", unit: "s", value: djContact, previousValues: [round(djContact * vary(r, 1.04, 0.02), 2), round(djContact * vary(r, 1.08, 0.02), 2)], levelAvg: 0.32, levelSD: 0.06, decimals: 2, reversed: true, showPR: true },
    { label: "藥球側拋 慣用手", unit: "kph", value: medDom, previousValues: [prev(medDom, 1), prev2(medDom, 1)], levelAvg: 48.0, levelSD: 8.0, decimals: 1, showPR: true },
    { label: "藥球側拋 非慣用手", unit: "kph", value: medNon, previousValues: [prev(medNon, 1), prev2(medNon, 1)], levelAvg: 45.0, levelSD: 7.0, decimals: 1, showPR: true },
    { label: "握力 慣用手", unit: "kg", value: gripDom, previousValues: [prev(gripDom, 1), prev2(gripDom, 1)], levelAvg: 38.0, levelSD: 8.0, decimals: 1, showPR: true },
    { label: "握力 非慣用手", unit: "kg", value: gripNon, previousValues: [prev(gripNon, 1), prev2(gripNon, 1)], levelAvg: 36.0, levelSD: 7.0, decimals: 1, showPR: true },
    { label: "引體向上", unit: "次", value: pullUp, previousValues: [Math.max(0, pullUp - Math.ceil(r() * 2)), Math.max(0, pullUp - Math.ceil(r() * 3))], levelAvg: 5, levelSD: 4, decimals: 0, showPR: true },
    { label: "衝刺 總完成時間", unit: "s", value: sprintTotal, previousValues: [prevTime(sprintTotal, 3), prev2Time(sprintTotal, 3)], levelAvg: 1.750, levelSD: 0.150, decimals: 3, reversed: true, showPR: true },
    { label: "衝刺 分段一完成時間", unit: "s", value: sprintSeg1, previousValues: [prevTime(sprintSeg1, 3), prev2Time(sprintSeg1, 3)], levelAvg: 5.100, levelSD: 0.350, decimals: 3, reversed: true },
  ];
}

// ═══════════════════════════════════════
// Swing mock data generator
// ═══════════════════════════════════════
export function getSwingMockRows(studentId: string): MetricRow[] {
  const p = getProfile(studentId);
  const r = seededRandom(hashCode(`swing_${studentId}`));

  const avgBat = round(vary(r, 112.3 * p.batSpeed, 0.06), 1);
  const maxBat = round(avgBat * vary(r, 1.08, 0.02), 1);
  const ratio = round(avgBat / maxBat, 3);
  const handSpeed = round(vary(r, 85.2 * p.speed, 0.08), 1);
  const effAttack = round(vary(r, 62.5, 0.12), 1);
  const avgAttack = round(vary(r, 10.2 * p.launchAngle, 0.15), 1);
  const ttc = round(vary(r, 0.148 / p.speed, 0.06), 3);
  const connDiff = round(vary(r, -2.5, 0.20), 1);
  const vertBat = round(vary(r, 28.5, 0.08), 1);
  const onPlane = round(vary(r, 82.3, 0.06), 1);

  const batSD = round(vary(r, 6.5, 0.15), 1);
  const attackSD = round(vary(r, 7.8, 0.15), 1);

  const prev = (v: number, d: number) => round(v * vary(r, 0.97, 0.02), d);
  const prev2 = (v: number, d: number) => round(v * vary(r, 0.94, 0.02), d);

  return [
    { label: "平均 揮棒速度", unit: "km/h", value: avgBat, previousValues: [prev(avgBat, 1), prev2(avgBat, 1)], levelAvg: 105.0, levelSD: 12.0, decimals: 1, showSD: true, sd: batSD, showPR: true },
    { label: "最高 揮棒速度", unit: "km/h", value: maxBat, previousValues: [prev(maxBat, 1), prev2(maxBat, 1)], levelAvg: 115.0, levelSD: 14.0, decimals: 1, showPR: true },
    { label: "平均/最高 揮棒速度 比值", value: ratio, previousValues: [round(ratio * vary(r, 0.99, 0.01), 3), round(ratio * vary(r, 0.98, 0.01), 3)], levelAvg: 0.910, levelSD: 0.04, decimals: 3, showPR: true },
    { label: "平均 峰值手腕速度", unit: "km/h", value: handSpeed, previousValues: [prev(handSpeed, 1), prev2(handSpeed, 1)], levelAvg: 80.0, levelSD: 10.0, decimals: 1, showPR: true },
    { label: "有效攻擊角度比例", unit: "%", value: effAttack, previousValues: [prev(effAttack, 1), prev2(effAttack, 1)], levelAvg: 55.0, levelSD: 15.0, decimals: 1, showPR: true },
    { label: "平均 攻擊角度", unit: "°", value: avgAttack, previousValues: [round(avgAttack * vary(r, 1.05, 0.03), 1), round(avgAttack * vary(r, 1.10, 0.03), 1)], decimals: 1, showSD: true, sd: attackSD, hideArrow: true, okRange: [5, 20] },
    { label: "平均 揮擊時間", unit: "s", value: ttc, previousValues: [round(ttc * vary(r, 1.02, 0.01), 3), round(ttc * vary(r, 1.05, 0.01), 3)], levelAvg: 0.155, levelSD: 0.015, decimals: 3, reversed: true, showPR: true },
    { label: "平均 連結性差異", value: connDiff, previousValues: [round(connDiff * vary(r, 1.10, 0.05), 1), round(connDiff * vary(r, 1.20, 0.05), 1)], levelAvg: -2.0, levelSD: 2.0, decimals: 1, reversed: true },
    { label: "平均 球棒垂直角度", unit: "°", value: vertBat, previousValues: [prev(vertBat, 1), prev2(vertBat, 1)], levelAvg: 30.0, levelSD: 5.0, decimals: 1 },
    { label: "平均 平面重和率", unit: "%", value: onPlane, previousValues: [prev(onPlane, 1), prev2(onPlane, 1)], levelAvg: 78.0, levelSD: 8.0, decimals: 1 },
  ];
}

// ═══════════════════════════════════════
// Hitting mock data generator
// ═══════════════════════════════════════
export function getHittingMockRows(studentId: string): MetricRow[] {
  const p = getProfile(studentId);
  const r = seededRandom(hashCode(`hitting_${studentId}`));

  const maxEV = round(vary(r, 152.3 * p.exitVelo, 0.06), 1);
  const avgEV = round(vary(r, 135.2 * p.exitVelo, 0.06), 1);
  const avgLA = round(vary(r, 12.5 * p.launchAngle, 0.15), 1);
  const hardLA = round(vary(r, 18.3 * p.launchAngle, 0.12), 1);
  const effLAPct = round(vary(r, 45.0, 0.15), 1);
  const pullLA = Math.round(vary(r, 15, 0.15));
  const centLA = Math.round(vary(r, 10, 0.20));
  const pushLA = Math.round(vary(r, 8, 0.20));
  const avgHA = round(vary(r, -5.2, 0.20), 1);
  const hardHA = round(vary(r, -8.5, 0.15), 1);
  const avgDist = round(vary(r, 65.2 * p.exitVelo, 0.08), 1);
  const hardDist = round(vary(r, 85.3 * p.exitVelo, 0.08), 1);
  const collision = round(vary(r, 1.18, 0.06), 2);

  const evSD = round(vary(r, 8.5, 0.15), 1);
  const laSD = round(vary(r, 8.2, 0.15), 1);

  const prev = (v: number, d: number) => round(v * vary(r, 0.97, 0.02), d);
  const prev2 = (v: number, d: number) => round(v * vary(r, 0.94, 0.02), d);

  return [
    { label: "最高 擊球初速", unit: "km/h", value: maxEV, previousValues: [prev(maxEV, 1), prev2(maxEV, 1)], levelAvg: 145.0, levelSD: 15.0, decimals: 1, showPR: true },
    { label: "平均 擊球初速", unit: "km/h", value: avgEV, previousValues: [prev(avgEV, 1), prev2(avgEV, 1)], levelAvg: 128.0, levelSD: 14.0, decimals: 1, showSD: true, sd: evSD, showPR: true },
    { label: "平均 擊球仰角", unit: "°", value: avgLA, previousValues: [round(avgLA * vary(r, 1.05, 0.03), 1), round(avgLA * vary(r, 1.10, 0.03), 1)], decimals: 1, showSD: true, sd: laSD, hideArrow: true, okRange: [10, 25] },
    { label: "強擊球 擊球仰角", unit: "°", value: hardLA, previousValues: [prev(hardLA, 1), prev2(hardLA, 1)], levelAvg: 16.0, levelSD: 5.0, decimals: 1 },
    { label: "有效擊球仰角比例", unit: "%", value: effLAPct, previousValues: [prev(effLAPct, 1), prev2(effLAPct, 1)], levelAvg: 40.0, levelSD: 12.0, decimals: 1, showPR: true },
    { label: "拉/中/推 平均仰角", unit: "°", value: `${pullLA}/${centLA}/${pushLA}`, previousValues: [`${pullLA + 1}/${centLA + 2}/${pushLA - 1}`, `${pullLA + 2}/${centLA + 1}/${pushLA - 2}`], hideArrow: true },
    { label: "平均 擊球水平角", unit: "°", value: avgHA, previousValues: [round(avgHA * vary(r, 0.95, 0.05), 1), round(avgHA * vary(r, 0.90, 0.05), 1)], levelAvg: -3.0, levelSD: 8.0, decimals: 1 },
    { label: "強擊球 擊球水平角", unit: "°", value: hardHA, previousValues: [round(hardHA * vary(r, 0.92, 0.05), 1), round(hardHA * vary(r, 0.88, 0.05), 1)], levelAvg: -5.0, levelSD: 10.0, decimals: 1 },
    { label: "平均飛行距離", unit: "m", value: avgDist, previousValues: [prev(avgDist, 1), prev2(avgDist, 1)], levelAvg: 58.0, levelSD: 15.0, decimals: 1, showPR: true },
    { label: "強擊球 飛行距離", unit: "m", value: hardDist, previousValues: [prev(hardDist, 1), prev2(hardDist, 1)], levelAvg: 78.0, levelSD: 18.0, decimals: 1, showPR: true },
    { label: "碰撞效率", value: collision, previousValues: [prev(collision, 2), prev2(collision, 2)], levelAvg: 1.10, levelSD: 0.15, decimals: 2, showPR: true },
  ];
}

// ═══════════════════════════════════════
// Pitch type mock data generator
// ═══════════════════════════════════════
interface PitchCell {
  value: number | string | null;
  prevs?: (number | string | null)[];
  sd?: number | null;
}

interface PitchTypeMetric {
  label: string;
  unit?: string;
  values: Record<string, PitchCell>;
  reversed?: boolean;
  decimals?: number;
  showSD?: boolean;
  formula?: string;
  dataSource?: string;
}

export function getPitchMockMetrics(studentId: string): PitchTypeMetric[] {
  const p = getProfile(studentId);
  const r = seededRandom(hashCode(`pitch_${studentId}`));
  const v = (base: number, mult = 1.0, pct = 0.08) => round(vary(r, base * mult, pct), 1);
  const vi = (base: number, mult = 1.0, pct = 0.08) => Math.round(vary(r, base * mult, pct));
  const prev = (val: number, d = 1) => round(val * vary(r, 0.98, 0.015), d);
  const prev2 = (val: number, d = 1) => round(val * vary(r, 0.96, 0.015), d);

  const fb = v(138.5, p.pitchVelo); const cb = v(118.3, p.pitchVelo * 0.95); const sl = v(125.7, p.pitchVelo * 0.97); const ch = v(122.1, p.pitchVelo * 0.96);
  const fbSpin = vi(2250, p.spinRate); const cbSpin = vi(2580, p.spinRate); const slSpin = vi(2380, p.spinRate * 0.98); const chSpin = vi(1820, p.spinRate * 0.95);

  return [
    { label: "球速", unit: "kph", values: { 四縫線: { value: fb, prevs: [prev(fb), prev2(fb)] }, 曲球: { value: cb, prevs: [prev(cb), prev2(cb)] }, 滑球: { value: sl, prevs: [prev(sl), prev2(sl)] }, 變速球: { value: ch, prevs: [prev(ch), prev2(ch)] } }, decimals: 1, dataSource: "Velo_Rapsodo" },
    { label: "旋轉方向", values: { 四縫線: { value: "12:15" }, 曲球: { value: "7:30" }, 滑球: { value: "9:45" }, 變速球: { value: "1:00" } }, dataSource: "SpinDirection" },
    { label: "旋轉效率", unit: "%", values: { 四縫線: { value: v(95.2, 1, 0.03) }, 曲球: { value: v(88.5, 1, 0.05) }, 滑球: { value: v(72.3, 1, 0.06) }, 變速球: { value: v(91.5, 1, 0.04) } }, decimals: 1, dataSource: "SpinEfficiency" },
    { label: "陀螺角度", unit: "°", values: { 四縫線: { value: v(5.2) }, 曲球: { value: v(42.5) }, 滑球: { value: v(55.3) }, 變速球: { value: v(8.1) } }, decimals: 1, dataSource: "GyroDegree" },
    { label: "轉速", unit: "rpm", values: { 四縫線: { value: fbSpin, prevs: [prev(fbSpin, 0), prev2(fbSpin, 0)], sd: vi(85, 1, 0.15) }, 曲球: { value: cbSpin, prevs: [prev(cbSpin, 0), prev2(cbSpin, 0)], sd: vi(92, 1, 0.15) }, 滑球: { value: slSpin, prevs: [prev(slSpin, 0), prev2(slSpin, 0)], sd: vi(78, 1, 0.15) }, 變速球: { value: chSpin, prevs: [prev(chSpin, 0), prev2(chSpin, 0)], sd: vi(65, 1, 0.15) } }, decimals: 0, showSD: true, dataSource: "TotalSpin" },
    { label: "垂直位移", unit: "cm", values: { 四縫線: { value: v(42.5), sd: v(3.2, 1, 0.15) }, 曲球: { value: v(-32.1), sd: v(4.1, 1, 0.15) }, 滑球: { value: v(18.3), sd: v(2.8, 1, 0.15) }, 變速球: { value: v(35.2), sd: v(3.5, 1, 0.15) } }, decimals: 1, showSD: true, dataSource: "VerticalBreak" },
    { label: "水平位移", unit: "cm", values: { 四縫線: { value: v(-18.5), sd: v(2.5, 1, 0.15) }, 曲球: { value: v(12.3), sd: v(3.0, 1, 0.15) }, 滑球: { value: v(-5.2), sd: v(1.8, 1, 0.15) }, 變速球: { value: v(-22.1), sd: v(2.2, 1, 0.15) } }, decimals: 1, showSD: true, dataSource: "HorizontalBreak" },
    { label: "出手延伸", unit: "cm", values: { 四縫線: { value: v(185.2, p.size) }, 曲球: { value: v(182.3, p.size) }, 滑球: { value: v(183.5, p.size) }, 變速球: { value: v(184.8, p.size) } }, decimals: 1, dataSource: "ReleaseExtension" },
    { label: "出手高度", unit: "cm", values: { 四縫線: { value: v(178.5, p.size) }, 曲球: { value: v(176.3, p.size) }, 滑球: { value: v(177.5, p.size) }, 變速球: { value: v(178.0, p.size) } }, decimals: 1, dataSource: "ReleaseHeight" },
    { label: "出手側向", unit: "cm", values: { 四縫線: { value: v(52.3) }, 曲球: { value: v(48.5) }, 滑球: { value: v(50.1) }, 變速球: { value: v(51.5) } }, decimals: 1, dataSource: "ReleaseSide" },
    { label: "垂直進壘角度", unit: "°", values: { 四縫線: { value: v(-4.8) }, 曲球: { value: v(-7.2) }, 滑球: { value: v(-5.5) }, 變速球: { value: v(-5.1) } }, decimals: 1, dataSource: "VAA" },
    { label: "水平進壘角度", unit: "°", values: { 四縫線: { value: v(1.2) }, 曲球: { value: v(-2.5) }, 滑球: { value: v(-1.8) }, 變速球: { value: v(0.8) } }, decimals: 1, dataSource: "HAA" },
  ];
}

export function getArmMockMetrics(studentId: string): PitchTypeMetric[] {
  const p = getProfile(studentId);
  const r = seededRandom(hashCode(`arm_${studentId}`));
  const v = (base: number, mult = 1.0, pct = 0.08) => round(vary(r, base * mult, pct), 1);
  const vi = (base: number, mult = 1.0, pct = 0.08) => Math.round(vary(r, base * mult, pct));
  const prev = (val: number, d = 1) => round(val * vary(r, 0.98, 0.015), d);
  const prev2 = (val: number, d = 1) => round(val * vary(r, 0.96, 0.015), d);

  const fbArm = vi(4850, p.speed * p.power); const cbArm = vi(4520, p.speed * p.power * 0.95); const slArm = vi(4650, p.speed * p.power * 0.97); const chArm = vi(4780, p.speed * p.power * 0.98);
  const fbTorque = v(65.2, p.power); const cbTorque = v(58.3, p.power * 0.95); const slTorque = v(62.1, p.power * 0.97); const chTorque = v(63.5, p.power * 0.98);

  return [
    { label: "揮臂速度", unit: "°/s", values: { 四縫線: { value: fbArm, prevs: [prev(fbArm, 0), prev2(fbArm, 0)] }, 曲球: { value: cbArm, prevs: [prev(cbArm, 0), prev2(cbArm, 0)] }, 滑球: { value: slArm, prevs: [prev(slArm, 0), prev2(slArm, 0)] }, 變速球: { value: chArm, prevs: [prev(chArm, 0), prev2(chArm, 0)] } }, decimals: 0, dataSource: "ArmSpeed" },
    { label: "出手角度", unit: "°", values: { 四縫線: { value: v(42.5) }, 曲球: { value: v(43.2) }, 滑球: { value: v(42.8) }, 變速球: { value: v(42.3) } }, decimals: 1, dataSource: "ReleaseAngle" },
    { label: "手肘外翻應力", unit: "Nm", values: { 四縫線: { value: fbTorque, prevs: [prev(fbTorque), prev2(fbTorque)] }, 曲球: { value: cbTorque, prevs: [prev(cbTorque), prev2(cbTorque)] }, 滑球: { value: slTorque, prevs: [prev(slTorque), prev2(slTorque)] }, 變速球: { value: chTorque, prevs: [prev(chTorque), prev2(chTorque)] } }, decimals: 1, dataSource: "ElbowTorque" },
    { label: "投球效率", values: { 四縫線: { value: round(v(138.5, p.pitchVelo) / fbTorque, 2) }, 曲球: { value: round(v(118.3, p.pitchVelo * 0.95) / cbTorque, 2) }, 滑球: { value: round(v(125.7, p.pitchVelo * 0.97) / slTorque, 2) }, 變速球: { value: round(v(122.1, p.pitchVelo * 0.96) / chTorque, 2) } }, decimals: 2, formula: "Velo_Rapsodo / ElbowTorque（球速 ÷ 外翻應力）", dataSource: "Velo_Rapsodo, ElbowTorque" },
  ];
}
