/**
 * ChartControlsContext / ChartFiltersContext
 * ChartModuleCard 提供兩個 DOM slot：
 *   - 左側 slot（ChartFilters）— 圖表自管的篩選器（如球種多選按鈕）
 *   - 右側 slot（ChartControls）— mode 切換器、metric 下拉選單…等控制項
 * 圖表透過 portal 送進 slot，使篩選與控制在同一列。
 */

import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

export const ChartControlsContext = createContext<HTMLDivElement | null>(null);
export const ChartFiltersContext = createContext<HTMLDivElement | null>(null);

export function useChartControlsSlot() {
  return useContext(ChartControlsContext);
}
export function useChartFiltersSlot() {
  return useContext(ChartFiltersContext);
}

/**
 * 便捷包裝：若 slot 存在，透過 portal 送出去；否則 fallback 正常渲染。
 */
export function ChartControls({ children }: { children: ReactNode }) {
  const slot = useChartControlsSlot();
  if (!slot) {
    return <div className="flex items-center justify-end">{children}</div>;
  }
  return createPortal(children, slot);
}

export function ChartFilters({ children }: { children: ReactNode }) {
  const slot = useChartFiltersSlot();
  if (!slot) {
    return <div className="flex items-center justify-start">{children}</div>;
  }
  return createPortal(children, slot);
}
