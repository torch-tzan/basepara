// Hook for role-based permission checks using Supabase Auth
import { useMemo } from "react";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useTeams } from "@/hooks/useSupabaseTeams";

export type PermissionModuleId =
  | "home"
  | "students"
  | "teams"
  | "schedule"
  | "reports"
  | "upload"
  | "comparison"
  | "templates"
  | "accounts";

interface Permission {
  view: boolean;
  edit: boolean;
  fullSite: boolean;
}

// Define permissions matrix based on roles
const rolePermissionsMatrix: Record<UserRole, Record<PermissionModuleId, Permission>> = {
  admin: {
    home: { view: true, edit: true, fullSite: true },
    students: { view: true, edit: true, fullSite: true },
    teams: { view: true, edit: true, fullSite: true },
    schedule: { view: true, edit: true, fullSite: true },
    reports: { view: true, edit: true, fullSite: true },
    upload: { view: true, edit: true, fullSite: true },
    comparison: { view: true, edit: true, fullSite: true },
    templates: { view: true, edit: true, fullSite: true },
    accounts: { view: true, edit: true, fullSite: true },
  },
  venue_coach: {
    home: { view: true, edit: true, fullSite: true },
    students: { view: true, edit: true, fullSite: true },
    teams: { view: true, edit: true, fullSite: true },
    schedule: { view: true, edit: true, fullSite: true },
    reports: { view: true, edit: true, fullSite: true },
    upload: { view: true, edit: true, fullSite: true },
    comparison: { view: true, edit: true, fullSite: true },
    templates: { view: true, edit: true, fullSite: true },
    accounts: { view: true, edit: false, fullSite: true },
  },
  team_coach: {
    home: { view: true, edit: false, fullSite: false },
    students: { view: true, edit: false, fullSite: false },
    teams: { view: true, edit: false, fullSite: false },
    schedule: { view: true, edit: false, fullSite: false },
    reports: { view: true, edit: false, fullSite: false },
    upload: { view: true, edit: true, fullSite: false },
    comparison: { view: true, edit: true, fullSite: false },
    templates: { view: true, edit: false, fullSite: false },
    accounts: { view: false, edit: false, fullSite: false },
  },
  student: {
    home: { view: true, edit: false, fullSite: false },
    students: { view: false, edit: false, fullSite: false },
    teams: { view: false, edit: false, fullSite: false },
    schedule: { view: true, edit: false, fullSite: false },
    reports: { view: true, edit: false, fullSite: false },
    upload: { view: false, edit: false, fullSite: false },
    comparison: { view: false, edit: false, fullSite: false },
    templates: { view: false, edit: false, fullSite: false },
    accounts: { view: false, edit: false, fullSite: false },
  },
};

export const useAuthPermissions = () => {
  const { authUser } = useAuth();
  const { data: teamsData } = useTeams();

  const permissions = useMemo(() => {
    if (!authUser?.role) {
      return null;
    }
    return rolePermissionsMatrix[authUser.role];
  }, [authUser?.role]);

  const hasPermission = (module: PermissionModuleId, type: "view" | "edit"): boolean => {
    if (!permissions) return false;
    return type === "view" ? permissions[module].view : permissions[module].edit;
  };

  const hasFullSiteAccess = (module: PermissionModuleId): boolean => {
    if (!permissions) return false;
    return permissions[module].fullSite;
  };

  const canAccessTeam = (teamId: string): boolean => {
    if (!authUser) return false;
    // Admins and venue coaches can access all teams
    if (authUser.role === "admin" || authUser.role === "venue_coach") {
      return true;
    }
    // Team coaches can only access their assigned teams
    return authUser.teamIds.includes(teamId);
  };

  const getAccessibleTeamIds = (): string[] => {
    if (!authUser) return [];
    // Admins and venue coaches can access all teams
    if (authUser.role === "admin" || authUser.role === "venue_coach") {
      return teamsData?.map(t => t.id) || [];
    }
    // Team coaches can only access their assigned teams
    return authUser.teamIds;
  };

  const isAdmin = authUser?.role === "admin";
  const isVenueCoach = authUser?.role === "venue_coach";
  const isTeamCoach = authUser?.role === "team_coach";
  const isStudent = authUser?.role === "student";
  const hasFullAccess = isAdmin || isVenueCoach;

  return {
    authUser,
    permissions,
    hasPermission,
    hasFullSiteAccess,
    canAccessTeam,
    getAccessibleTeamIds,
    isAdmin,
    isVenueCoach,
    isTeamCoach,
    isStudent,
    hasFullAccess,
  };
};
