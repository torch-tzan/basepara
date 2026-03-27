/**
 * 圖表模組元件索引
 * 將模組 ID 映射到對應的圖表元件
 */
import { lazy, type ComponentType } from "react";

// Lazy load all chart components
const BattingSummaryChart = lazy(() => import("./BattingSummaryChart"));
const LaunchAngleVeloChart = lazy(() => import("./LaunchAngleVeloChart"));
const HorizontalAngleVeloChart = lazy(() => import("./HorizontalAngleVeloChart"));
const AttackAngleQualityChart = lazy(() => import("./AttackAngleQualityChart"));
const FieldHitChart = lazy(() => import("./FieldHitChart"));
const AttackAngleSwingTimeChart = lazy(() => import("./AttackAngleSwingTimeChart"));
const BattingDistributionChart = lazy(() => import("./BattingDistributionChart"));
const StrikeZoneHeatmap = lazy(() => import("./StrikeZoneHeatmap"));
const PitchingDistributionChart = lazy(() => import("./PitchingDistributionChart"));
const PitchMovementChart = lazy(() => import("./PitchMovementChart"));
const PitchLocationChart = lazy(() => import("./PitchLocationChart"));
const ReleasePointChart = lazy(() => import("./ReleasePointChart"));

// Module ID → Chart Component mapping
export const chartComponentMap: Record<string, ComponentType> = {
  batting_3_0: BattingSummaryChart,
  batting_3_1: LaunchAngleVeloChart,
  batting_3_2: HorizontalAngleVeloChart,
  batting_3_3: AttackAngleQualityChart,
  batting_3_4: FieldHitChart,
  batting_3_5: AttackAngleSwingTimeChart,
  batting_3_6: BattingDistributionChart,
  batting_3_7: StrikeZoneHeatmap,
  pitching_4_1: PitchingDistributionChart,
  pitching_4_2: PitchMovementChart,
  pitching_4_3: PitchLocationChart,
  pitching_4_4: ReleasePointChart,
};
