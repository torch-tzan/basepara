import type { ActionCategory } from "@/data/trainingTemplates";

// 課程動作項目介面（支援重複加入與自訂參數）
export interface CourseActionItem {
  uid: string;         // 唯一識別（用於列表 key 與刪除）
  actionId: string;    // 對應的動作範本 ID
  name: string;        // 動作名稱（來自範本）
  category: string;    // 動作分類
  actionCategory: ActionCategory;
  sets: number;        // 可自訂的組數（預設來自範本）
  reps: number;        // 可自訂的次數（預設來自範本）
  intensity: number;   // 可自訂的強度（預設來自範本）
}

// 生成唯一 ID
export const generateCourseActionUid = (): string => {
  return `ca_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
