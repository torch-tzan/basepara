import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type AuditActionType = Database["public"]["Enums"]["audit_action_type"];

export interface AuditLogRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action_type: AuditActionType;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface UseAuditLogsOptions {
  limit?: number;
  actionType?: AuditActionType;
  targetType?: string;
  userId?: string;
}

// Action type display names
export const actionTypeLabels: Record<AuditActionType, string> = {
  account_created: "建立帳號",
  account_updated: "更新帳號",
  account_deleted: "刪除帳號",
  account_activated: "啟用帳號",
  account_deactivated: "停用帳號",
  role_changed: "變更角色",
  password_reset_requested: "請求重設密碼",
  role_created: "建立角色",
  role_updated: "更新角色",
  role_deleted: "刪除角色",
  permission_changed: "變更權限",
  team_created: "建立球隊",
  team_updated: "更新球隊",
  team_deleted: "刪除球隊",
  student_created: "建立學員",
  student_updated: "更新學員",
  student_deleted: "刪除學員",
  course_created: "建立課程",
  course_updated: "更新課程",
  course_deleted: "刪除課程",
  login_success: "登入成功",
  logout: "登出",
};

// Target type display names
export const targetTypeLabels: Record<string, string> = {
  account: "帳號",
  role: "角色",
  team: "球隊",
  student: "學員",
  course: "課程",
};

export const useAuditLogs = (options: UseAuditLogsOptions = {}) => {
  const { limit = 50, actionType, targetType, userId } = options;
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (actionType) {
        query = query.eq("action_type", actionType);
      }
      if (targetType) {
        query = query.eq("target_type", targetType);
      }
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setLogs((data as AuditLogRecord[]) || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setError("無法載入操作日誌");
    } finally {
      setIsLoading(false);
    }
  }, [limit, actionType, targetType, userId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    refetch: fetchLogs,
  };
};
