/**
 * 資料來源（Data Source）型別與判定邏輯
 *
 * 用途：標示每筆上傳資料的來源信任等級，決定是否納入「層級比較」與「檢測報告比較」的母體計算。
 *
 * 判定邏輯：
 *  - 由「目前登入使用者的角色」是否有「能否納入成績比較」勾選決定
 *  - 在 RolePermissions 頁面切換 `includeInLevelComparison` 開關控制
 *  - 預設：Admin、場館教練 → internal；球隊教練、學員、其他 → external
 */

/** internal = 內部上傳（可納入比較）；external = 外部上傳（僅顯示，不納入比較） */
export type DataSource = "internal" | "external";

/** 上傳資料的共用標籤欄位（mock 資料層使用） */
export interface DataSourceMeta {
  /** 上傳來源類別 */
  dataSource: DataSource;
  /** 上傳者帳號 ID（追溯用，可選） */
  uploadedBy?: string;
  /** 上傳者角色 ID（追溯用，可選） */
  uploadedByRole?: string;
  /** 上傳時間（ISO 字串，可選） */
  uploadedAt?: string;
}

/** 顯示用標籤文字 */
export const dataSourceLabels: Record<DataSource, string> = {
  internal: "內部上傳",
  external: "外部上傳",
};

/** 標籤顏色語意（給 Badge 等元件使用） */
export const dataSourceTone: Record<DataSource, "default" | "muted"> = {
  internal: "default",
  external: "muted",
};
