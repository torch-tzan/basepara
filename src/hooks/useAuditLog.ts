import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Database, Json } from "@/integrations/supabase/types";

type AuditActionType = Database["public"]["Enums"]["audit_action_type"];
type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];
type AuditDetails = Record<string, Json | undefined>;

interface AuditLogEntry {
  actionType: AuditActionType;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  details?: AuditDetails;
}

export const useAuditLog = () => {
  const { authUser, user } = useAuth();

  const logAction = useCallback(
    async (entry: AuditLogEntry) => {
      if (!user || !authUser) {
        console.warn("Cannot log action: user not authenticated");
        return;
      }

      try {
        const logEntry: AuditLogInsert = {
          user_id: user.id,
          user_name: authUser.name,
          user_email: user.email || "",
          action_type: entry.actionType,
          target_type: entry.targetType || null,
          target_id: entry.targetId || null,
          target_name: entry.targetName || null,
          details: entry.details as Json | null,
        };

        const { error } = await supabase.from("audit_logs").insert(logEntry);

        if (error) {
          console.error("Failed to log audit action:", error);
        }
      } catch (err) {
        console.error("Error logging audit action:", err);
      }
    },
    [authUser, user]
  );

  // Convenience methods for common actions
  const logAccountCreated = useCallback(
    (accountId: string, accountName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "account_created",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
        details,
      });
    },
    [logAction]
  );

  const logAccountUpdated = useCallback(
    (accountId: string, accountName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "account_updated",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
        details,
      });
    },
    [logAction]
  );

  const logAccountDeleted = useCallback(
    (accountId: string, accountName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "account_deleted",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
        details,
      });
    },
    [logAction]
  );

  const logAccountActivated = useCallback(
    (accountId: string, accountName: string) => {
      return logAction({
        actionType: "account_activated",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
      });
    },
    [logAction]
  );

  const logAccountDeactivated = useCallback(
    (accountId: string, accountName: string) => {
      return logAction({
        actionType: "account_deactivated",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
      });
    },
    [logAction]
  );

  const logRoleChanged = useCallback(
    (accountId: string, accountName: string, oldRole: string, newRole: string) => {
      return logAction({
        actionType: "role_changed",
        targetType: "account",
        targetId: accountId,
        targetName: accountName,
        details: { oldRole, newRole },
      });
    },
    [logAction]
  );

  const logPasswordResetRequested = useCallback(
    (accountId: string, accountEmail: string) => {
      return logAction({
        actionType: "password_reset_requested",
        targetType: "account",
        targetId: accountId,
        targetName: accountEmail,
      });
    },
    [logAction]
  );

  const logPermissionChanged = useCallback(
    (roleId: string, roleName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "permission_changed",
        targetType: "role",
        targetId: roleId,
        targetName: roleName,
        details,
      });
    },
    [logAction]
  );

  const logTeamCreated = useCallback(
    (teamId: string, teamName: string) => {
      return logAction({
        actionType: "team_created",
        targetType: "team",
        targetId: teamId,
        targetName: teamName,
      });
    },
    [logAction]
  );

  const logTeamUpdated = useCallback(
    (teamId: string, teamName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "team_updated",
        targetType: "team",
        targetId: teamId,
        targetName: teamName,
        details,
      });
    },
    [logAction]
  );

  const logTeamDeleted = useCallback(
    (teamId: string, teamName: string) => {
      return logAction({
        actionType: "team_deleted",
        targetType: "team",
        targetId: teamId,
        targetName: teamName,
      });
    },
    [logAction]
  );

  const logStudentCreated = useCallback(
    (studentId: string, studentName: string) => {
      return logAction({
        actionType: "student_created",
        targetType: "student",
        targetId: studentId,
        targetName: studentName,
      });
    },
    [logAction]
  );

  const logStudentUpdated = useCallback(
    (studentId: string, studentName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "student_updated",
        targetType: "student",
        targetId: studentId,
        targetName: studentName,
        details,
      });
    },
    [logAction]
  );

  const logStudentDeleted = useCallback(
    (studentId: string, studentName: string) => {
      return logAction({
        actionType: "student_deleted",
        targetType: "student",
        targetId: studentId,
        targetName: studentName,
      });
    },
    [logAction]
  );

  const logCourseCreated = useCallback(
    (courseId: string, courseName: string) => {
      return logAction({
        actionType: "course_created",
        targetType: "course",
        targetId: courseId,
        targetName: courseName,
      });
    },
    [logAction]
  );

  const logCourseUpdated = useCallback(
    (courseId: string, courseName: string, details?: AuditDetails) => {
      return logAction({
        actionType: "course_updated",
        targetType: "course",
        targetId: courseId,
        targetName: courseName,
        details,
      });
    },
    [logAction]
  );

  const logCourseDeleted = useCallback(
    (courseId: string, courseName: string) => {
      return logAction({
        actionType: "course_deleted",
        targetType: "course",
        targetId: courseId,
        targetName: courseName,
      });
    },
    [logAction]
  );

  return {
    logAction,
    logAccountCreated,
    logAccountUpdated,
    logAccountDeleted,
    logAccountActivated,
    logAccountDeactivated,
    logRoleChanged,
    logPasswordResetRequested,
    logPermissionChanged,
    logTeamCreated,
    logTeamUpdated,
    logTeamDeleted,
    logStudentCreated,
    logStudentUpdated,
    logStudentDeleted,
    logCourseCreated,
    logCourseUpdated,
    logCourseDeleted,
  };
};
