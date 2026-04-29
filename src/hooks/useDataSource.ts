/**
 * useDataSource — 依目前登入使用者的角色，回傳該使用者上傳資料應標記的 data_source。
 *
 * 規則：
 *  1. 若目前使用者所屬角色 `includeInLevelComparison === true` → "internal"
 *  2. 否則 → "external"
 *  3. 若無登入使用者（理論上頁面已被 ProtectedRoute 擋下），預設 "external" 保守處理
 *
 * 用途：上傳資料時自動帶入 dataSource 欄位，未來若要切換到 Supabase 寫入，
 *      只需在這裡擴充寫入流程即可，呼叫端不需變動。
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AccountsContext";
import type { DataSource, DataSourceMeta } from "@/types/dataSource";

interface UseDataSourceResult {
  /** 目前使用者上傳資料的來源類別 */
  dataSource: DataSource;
  /** 是否會被納入層級比較母體（與 dataSource === "internal" 同義，僅為閱讀方便） */
  isInternal: boolean;
  /** 用於附加到一筆 mock 資料上的完整 meta */
  meta: DataSourceMeta;
}

export const useDataSource = (): UseDataSourceResult => {
  const { authUser } = useAuth();
  const { getRoleById } = useAccounts();

  return useMemo<UseDataSourceResult>(() => {
    // 取得使用者角色設定（資料來源：AccountsContext）
    const role = authUser?.role ? getRoleById(authUser.role) : null;

    // 預設規則 fallback（DB 角色尚未顯式設定 includeInLevelComparison 時）：
    //   admin / venue_coach → internal
    //   其他角色（含 team_coach、student）→ external
    const fallbackInternal =
      authUser?.role === "admin" || authUser?.role === "venue_coach";

    const isInternal = role?.includeInLevelComparison ?? fallbackInternal;
    const dataSource: DataSource = isInternal ? "internal" : "external";

    return {
      dataSource,
      isInternal,
      meta: {
        dataSource,
        uploadedBy: authUser?.id,
        uploadedByRole: authUser?.role ?? undefined,
        uploadedAt: new Date().toISOString(),
      },
    };
  }, [authUser, getRoleById]);
};
