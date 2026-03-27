// ============= Data Access Hook =============
// Provides filtered data based on user permissions (fullSite flag)
// When fullSite is OFF, users only see teams/students they are responsible for

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModuleId } from "@/data/accountsData";
import { useStudents, type StudentData } from "@/contexts/StudentsContext";
import { useTeams, type Team } from "@/contexts/TeamsContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { useReportsWithDetails, type ReportWithDetails } from "@/hooks/useSupabaseReports";

// Re-export types for convenience
export type { StudentData } from "@/contexts/StudentsContext";
export type TeamData = Team;
export type { ReportWithDetails } from "@/hooks/useSupabaseReports";

export interface DataAccessResult {
  // Accessible data
  accessibleTeamIds: string[];
  accessibleStudentIds: string[];
  
  // Filtered data arrays
  filteredTeams: Team[];
  filteredStudents: StudentData[];
  filteredReports: ReportWithDetails[];
  
  // Filtered options for dropdowns
  filteredTeamOptions: { value: string; label: string }[];
  filteredCoachOptions: { value: string; label: string }[];
  filteredStudentOptions: { value: string; label: string }[];
  
  // Permission info
  hasFullSiteAccess: boolean;
  currentCoachId: string | null;
  
  // Loading state
  isLoading: boolean;
}

export const useDataAccess = (moduleId: PermissionModuleId): DataAccessResult => {
  const { authUser } = useAuth();
  const { getModulePermissions } = usePermissions();
  const { students, isLoading: studentsLoading } = useStudents();
  const { teams, isLoading: teamsLoading } = useTeams();
  const { accounts, isLoading: accountsLoading } = useAccounts();
  const { data: reportsData, isLoading: reportsLoading } = useReportsWithDetails();
  
  const modulePermissions = getModulePermissions(moduleId);
  const hasFullSiteAccess = modulePermissions.fullSite;
  
  const isLoading = studentsLoading || teamsLoading || accountsLoading || reportsLoading;
  
  // Find the current user's account ID (if they are a coach/account)
  const currentCoachId = useMemo(() => {
    if (!authUser) return null;
    const account = accounts.find((a) => a.name === authUser.name || a.email === authUser.email);
    return account?.id || null;
  }, [authUser, accounts]);
  
  // Get teams where this coach is assigned
  const getTeamsForCoach = (accountId: string): Team[] => {
    return teams.filter((team) => team.coachIds.includes(accountId));
  };
  
  // Get students where this coach is either team coach or responsible coach
  const getStudentsForCoach = (accountId: string): StudentData[] => {
    const coachTeamIds = getTeamsForCoach(accountId).map((t) => t.id);
    
    return students.filter((student) => {
      // Coach is responsible for this student (by name or id)
      if (student.responsibleCoaches.some((coach) => {
        const coachAccount = accounts.find((a) => a.name === coach);
        return coachAccount?.id === accountId;
      })) return true;
      
      // Coach belongs to the student's team
      if (coachTeamIds.includes(student.teamId)) return true;
      
      return false;
    });
  };
  
  // Calculate accessible team IDs
  const accessibleTeamIds = useMemo(() => {
    // Full site access (admin/venue_coach with fullSite permission) - all teams
    if (hasFullSiteAccess) {
      return teams.map((t) => t.id);
    }
    
    // Use authUser.teamIds first (from user_team_assignments, used by RLS)
    // This ensures frontend filtering matches RLS policies
    if (authUser?.teamIds && authUser.teamIds.length > 0) {
      return authUser.teamIds;
    }
    
    // Fallback: use account_teams via TeamsContext
    if (currentCoachId) {
      const coachTeams = getTeamsForCoach(currentCoachId);
      return coachTeams.map((t) => t.id);
    }
    
    return [];
  }, [hasFullSiteAccess, currentCoachId, authUser?.teamIds, teams]);
  
  // Calculate accessible student IDs
  const accessibleStudentIds = useMemo(() => {
    // Full site access (admin/venue_coach with fullSite permission) - all students
    if (hasFullSiteAccess) {
      return students.map((s) => s.id);
    }
    
    // Student role: find their own student record by email match
    if (authUser?.role === "student" && authUser?.email) {
      const ownStudent = students.find((s) => s.email === authUser.email);
      if (ownStudent) {
        return [ownStudent.id];
      }
      // Fallback: return empty if no matching student record
      return [];
    }
    
    // Use authUser.teamIds first (matches RLS logic)
    if (authUser?.teamIds && authUser.teamIds.length > 0) {
      return students
        .filter((s) => authUser.teamIds.includes(s.teamId))
        .map((s) => s.id);
    }
    
    // Fallback: use currentCoachId for coach-student relationships
    if (currentCoachId) {
      const coachStudents = getStudentsForCoach(currentCoachId);
      return coachStudents.map((s) => s.id);
    }
    
    return [];
  }, [hasFullSiteAccess, currentCoachId, authUser?.teamIds, authUser?.email, authUser?.role, students]);
  
  // Filtered teams data
  const filteredTeams = useMemo(() => {
    if (hasFullSiteAccess) return teams;
    return teams.filter((t) => accessibleTeamIds.includes(t.id));
  }, [hasFullSiteAccess, accessibleTeamIds, teams]);
  
  // Filtered students data
  const filteredStudents = useMemo(() => {
    if (hasFullSiteAccess) return students;
    return students.filter((s) => accessibleStudentIds.includes(s.id));
  }, [hasFullSiteAccess, accessibleStudentIds, students]);
  
  // Filtered reports data
  const filteredReports = useMemo(() => {
    const reports = reportsData || [];
    if (hasFullSiteAccess) return reports;
    return reports.filter((r) => accessibleStudentIds.includes(r.studentId));
  }, [hasFullSiteAccess, accessibleStudentIds, reportsData]);
  
  // Filtered team options for dropdowns
  const filteredTeamOptions = useMemo(() => {
    const allOption = { value: "all", label: "全部球隊" };
    const teamOpts = teams.map((t) => ({ value: t.id, label: t.name }));
    
    if (hasFullSiteAccess) return [allOption, ...teamOpts];
    
    const filtered = teamOpts.filter((opt) => accessibleTeamIds.includes(opt.value));
    return [allOption, ...filtered];
  }, [hasFullSiteAccess, accessibleTeamIds, teams]);
  
  // Filtered coach options (coaches in accessible teams)
  const filteredCoachOptions = useMemo(() => {
    const allOption = { value: "all", label: "所有教練" };
    const coachOpts = accounts
      .filter((a) => a.roleId !== "admin") // Exclude admin from coach options
      .map((a) => ({ value: a.id, label: a.name }));
    
    if (hasFullSiteAccess) return [allOption, ...coachOpts];
    
    // Get coaches that belong to any of the accessible teams
    const accessibleCoachIds = new Set<string>();
    accessibleTeamIds.forEach((teamId) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
        team.coachIds.forEach((id) => accessibleCoachIds.add(id));
      }
    });
    
    const filtered = coachOpts.filter((opt) => accessibleCoachIds.has(opt.value));
    return [allOption, ...filtered];
  }, [hasFullSiteAccess, accessibleTeamIds, teams, accounts]);
  
  // Filtered student options for dropdowns
  const filteredStudentOptions = useMemo(() => {
    const options = filteredStudents.map((s) => ({
      value: s.id,
      label: s.name,
    }));
    return [{ value: "all", label: "全部學員" }, ...options];
  }, [filteredStudents]);
  
  return {
    accessibleTeamIds,
    accessibleStudentIds,
    filteredTeams,
    filteredStudents,
    filteredReports,
    filteredTeamOptions,
    filteredCoachOptions,
    filteredStudentOptions,
    hasFullSiteAccess,
    currentCoachId,
    isLoading,
  };
};

// Helper hook to get filtered student options by team
export const useFilteredStudentsByTeam = (
  moduleId: PermissionModuleId,
  teamId: string | null
) => {
  const { accessibleStudentIds, hasFullSiteAccess } = useDataAccess(moduleId);
  const { students } = useStudents();
  
  return useMemo(() => {
    if (!teamId || teamId === "all") return [];
    
    let filteredStudents = students.filter((s) => s.teamId === teamId);
    
    // If not full site access, further filter by accessible students
    if (!hasFullSiteAccess) {
      filteredStudents = filteredStudents.filter((s) => accessibleStudentIds.includes(s.id));
    }
    
    return filteredStudents.map((s) => ({
      value: s.id,
      label: s.name,
    }));
  }, [teamId, accessibleStudentIds, hasFullSiteAccess, students]);
};
