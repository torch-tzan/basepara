import { useMemo } from "react";
import type { ComparisonTarget } from "@/components/comparison/TargetSelector";
import type { ComparisonMetricValue } from "@/components/comparison/ComparisonTable";
import type { ComparisonPitchValue } from "@/components/comparison/ComparisonPitchTable";
import type { ComparisonType } from "@/data/metricDefinitions";
import {
  getFitnessMetrics,
  getSwingMetrics,
  getHittingMetrics,
  getPitchMetrics,
  getArmMetrics,
} from "@/data/metricDefinitions";

// ═══════════════════════════════════════
// Mock 值生成器（Phase 1）
// Phase 2 改為從 chart_data 取值
// ═══════════════════════════════════════

/**
 * 每個 metric key 的 mock 基準值。
 * 個人 target 使用這些值；聚合 target 加上隨機偏移。
 */
const MOCK_BASE: Record<string, { value: number | string; sd?: number }> = {
  // ── fitness ──
  fitness_netWeight: { value: 68.5 },
  fitness_skeletalMuscle: { value: 32.1 },
  fitness_bodyFat: { value: 14.2 },
  fitness_cmjHeight: { value: 42.5 },
  fitness_djRSI: { value: 1.35 },
  fitness_djContact: { value: 0.28 },
  fitness_medballDom: { value: 52.3 },
  fitness_medballNon: { value: 48.7 },
  fitness_gripDom: { value: 42.0 },
  fitness_gripNon: { value: 39.5 },
  fitness_pullUp: { value: 8 },
  // ── swing ──
  swing_avgBatSpeed: { value: 112.3, sd: 6.5 },
  swing_maxBatSpeed: { value: 121.5 },
  swing_batSpeedRatio: { value: 0.924 },
  swing_peakHandSpeed: { value: 85.2 },
  swing_effectiveAttackPct: { value: 62.5 },
  swing_avgAttackAngle: { value: 10.2, sd: 7.8 },
  swing_timeToContact: { value: 0.148 },
  swing_connectionDiff: { value: -2.5 },
  swing_vertBatAngle: { value: 28.5 },
  swing_onPlaneEff: { value: 82.3 },
  // ── hitting ──
  hitting_maxExitVelo: { value: 152.3 },
  hitting_avgExitVelo: { value: 135.2, sd: 8.5 },
  hitting_avgLaunchAngle: { value: 12.5, sd: 8.2 },
  hitting_hardHitLA: { value: 18.3 },
  hitting_effectiveLAPct: { value: 45.0 },
  hitting_pullCenterPushLA: { value: "15/10/8" },
  hitting_avgHorizAngle: { value: -5.2 },
  hitting_hardHitHorizAngle: { value: -8.5 },
  hitting_avgDistance: { value: 65.2 },
  hitting_hardHitDistance: { value: 85.3 },
  hitting_collisionEff: { value: 1.18 },
};

/** 投球指標 mock：依球種分欄 */
const MOCK_PITCH_BASE: Record<string, Record<string, { value: number | string; sd?: number }>> = {
  pitch_velo: { 四縫線: { value: 138.5 }, 曲球: { value: 118.3 }, 滑球: { value: 125.7 }, 變速球: { value: 122.1 } },
  pitch_spinDir: { 四縫線: { value: "12:15" }, 曲球: { value: "7:30" }, 滑球: { value: "9:45" }, 變速球: { value: "1:00" } },
  pitch_spinEff: { 四縫線: { value: 95.2 }, 曲球: { value: 88.5 }, 滑球: { value: 72.3 }, 變速球: { value: 91.5 } },
  pitch_gyroDeg: { 四縫線: { value: 5.2 }, 曲球: { value: 42.5 }, 滑球: { value: 55.3 }, 變速球: { value: 8.1 } },
  pitch_totalSpin: { 四縫線: { value: 2250, sd: 85 }, 曲球: { value: 2580, sd: 92 }, 滑球: { value: 2380, sd: 78 }, 變速球: { value: 1820, sd: 65 } },
  pitch_vertBreak: { 四縫線: { value: 42.5, sd: 3.2 }, 曲球: { value: -32.1, sd: 4.1 }, 滑球: { value: 18.3, sd: 2.8 }, 變速球: { value: 35.2, sd: 3.5 } },
  pitch_horizBreak: { 四縫線: { value: -18.5, sd: 2.5 }, 曲球: { value: 12.3, sd: 3.0 }, 滑球: { value: -5.2, sd: 1.8 }, 變速球: { value: -22.1, sd: 2.2 } },
  pitch_extension: { 四縫線: { value: 185.2 }, 曲球: { value: 182.3 }, 滑球: { value: 183.5 }, 變速球: { value: 184.8 } },
  pitch_releaseH: { 四縫線: { value: 178.5 }, 曲球: { value: 176.3 }, 滑球: { value: 177.5 }, 變速球: { value: 178.0 } },
  pitch_releaseSide: { 四縫線: { value: 52.3 }, 曲球: { value: 48.5 }, 滑球: { value: 50.1 }, 變速球: { value: 51.5 } },
  pitch_vaa: { 四縫線: { value: -4.8 }, 曲球: { value: -7.2 }, 滑球: { value: -5.5 }, 變速球: { value: -5.1 } },
  pitch_haa: { 四縫線: { value: 1.2 }, 曲球: { value: -2.5 }, 滑球: { value: -1.8 }, 變速球: { value: 0.8 } },
  // arm metrics
  arm_armSpeed: { 四縫線: { value: 4850 }, 曲球: { value: 4520 }, 滑球: { value: 4650 }, 變速球: { value: 4780 } },
  arm_releaseAngle: { 四縫線: { value: 42.5 }, 曲球: { value: 43.2 }, 滑球: { value: 42.8 }, 變速球: { value: 42.3 } },
  arm_elbowTorque: { 四縫線: { value: 65.2 }, 曲球: { value: 58.3 }, 滑球: { value: 62.1 }, 變速球: { value: 63.5 } },
  arm_pitchEfficiency: { 四縫線: { value: 2.12 }, 曲球: { value: 2.03 }, 滑球: { value: 2.02 }, 變速球: { value: 1.92 } },
};

// ── 確定性偏移（以 target id hash 為種子，不用真隨機，才能在 re-render 時穩定） ──
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 為聚合 target 產生偏移後的 mock 值 */
function generateAggregateValues(
  targetId: string,
  keys: string[]
): ComparisonMetricValue[] {
  const rand = seededRandom(Math.abs(hashCode(targetId)) + 1);
  return keys.map((key) => {
    const base = MOCK_BASE[key];
    if (!base || typeof base.value === "string") {
      return { key, value: base?.value ?? null };
    }
    // 偏移 ±15%
    const offset = (rand() - 0.5) * 0.3 * Math.abs(base.value || 1);
    const val = base.value + offset;
    const sd = Math.abs(val * (0.05 + rand() * 0.1));
    const n = Math.floor(40 + rand() * 160);
    return { key, value: val, sd, n };
  });
}

function generateIndividualValues(keys: string[]): ComparisonMetricValue[] {
  return keys.map((key) => {
    const base = MOCK_BASE[key];
    if (!base) return { key, value: null };
    return { key, value: base.value, sd: base.sd };
  });
}

function generatePitchValues(
  targetId: string,
  pitchType: string,
  keys: string[],
  isAggregate: boolean
): ComparisonPitchValue[] {
  const rand = seededRandom(Math.abs(hashCode(targetId + pitchType)) + 1);
  return keys.map((key) => {
    const byPitch = MOCK_PITCH_BASE[key];
    if (!byPitch) return { key, value: null };
    const cell = byPitch[pitchType];
    if (!cell) return { key, value: null };

    if (typeof cell.value === "string") {
      return { key, value: cell.value };
    }

    if (isAggregate) {
      const offset = (rand() - 0.5) * 0.2 * Math.abs(cell.value || 1);
      const val = cell.value + offset;
      const sd = cell.sd ?? Math.abs(val * (0.05 + rand() * 0.08));
      const n = Math.floor(30 + rand() * 120);
      return { key, value: val, sd, n };
    }

    return { key, value: cell.value, sd: cell.sd };
  });
}

// ═══════════════════════════════════════
// Hook
// ═══════════════════════════════════════
interface UseComparisonDataParams {
  targetA: ComparisonTarget | null;
  targetB: ComparisonTarget | null;
  comparisonType: ComparisonType;
  pitchType?: string;
}

interface ComparisonDataResult {
  /** 一般指標值（身體素質/揮棒/擊球） */
  valuesA: ComparisonMetricValue[];
  valuesB: ComparisonMetricValue[];
  /** 投球指標值（依選定球種） */
  pitchValuesA: ComparisonPitchValue[];
  pitchValuesB: ComparisonPitchValue[];
  isReady: boolean;
}

export const useComparisonData = ({
  targetA,
  targetB,
  comparisonType,
  pitchType = "四縫線",
}: UseComparisonDataParams): ComparisonDataResult => {
  const result = useMemo<ComparisonDataResult>(() => {
    const empty: ComparisonDataResult = {
      valuesA: [],
      valuesB: [],
      pitchValuesA: [],
      pitchValuesB: [],
      isReady: false,
    };

    if (!targetA?.id || !targetB?.id) return empty;

    const isAAggregate = targetA.type !== "individual";
    const isBAggregate = targetB.type !== "individual";

    // 把 secondary filter 併入 seed，讓不同篩選組合產出不同數據
    const seedA = `${targetA.id}|${targetA.secondary?.id || ""}`;
    const seedB = `${targetB.id}|${targetB.secondary?.id || ""}`;

    if (comparisonType === "投球") {
      // 投球：pitch + arm metrics
      const pitchKeys = getPitchMetrics().map((m) => m.key);
      const armKeys = getArmMetrics().map((m) => m.key);
      const allKeys = [...pitchKeys, ...armKeys];

      return {
        valuesA: [],
        valuesB: [],
        pitchValuesA: generatePitchValues(seedA, pitchType, allKeys, isAAggregate),
        pitchValuesB: generatePitchValues(seedB, pitchType, allKeys, isBAggregate),
        isReady: true,
      };
    }

    // 身體素質 / 打擊：一般 metrics
    let keys: string[] = [];
    if (comparisonType === "身體素質") {
      keys = getFitnessMetrics().map((m) => m.key);
    } else {
      // 打擊 = swing + hitting
      keys = [
        ...getSwingMetrics().map((m) => m.key),
        ...getHittingMetrics().map((m) => m.key),
      ];
    }

    return {
      valuesA: isAAggregate
        ? generateAggregateValues(seedA, keys)
        : generateIndividualValues(keys),
      valuesB: isBAggregate
        ? generateAggregateValues(seedB, keys)
        : generateIndividualValues(keys),
      pitchValuesA: [],
      pitchValuesB: [],
      isReady: true,
    };
  }, [targetA?.id, targetA?.type, targetA?.secondary?.id, targetB?.id, targetB?.type, targetB?.secondary?.id, comparisonType, pitchType]);

  return result;
};
