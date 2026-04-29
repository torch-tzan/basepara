import { createContext, useContext, useMemo, ReactNode, useState } from "react";
import {
  useStudents as useSupabaseStudentsQuery,
  useArchivedStudents as useSupabaseArchivedStudentsQuery,
  useUpdateStudent,
  useDeleteStudent,
  useArchiveStudent as useArchiveStudentMutation,
  type StudentWithCoaches,
} from "@/hooks/useSupabaseStudents";
import { useTeams as useSupabaseTeamsQuery } from "@/hooks/useSupabaseTeams";
import { useAccounts as useSupabaseAccountsQuery } from "@/hooks/useSupabaseAccounts";
import { useCreateStudentAccount } from "@/hooks/useCreateStudentAccount";

// ============= Types =============
export interface TeamHistoryItem {
  id: string;
  teamId: string;
  teamName: string;
  teamAttribute?: string;
  isCurrent: boolean;
  startDate?: string;
  endDate?: string;
  teamCoaches: string[];
  responsibleCoaches: string[];
  responsibleCoachIds: string[];
}

export interface StudentData {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  /** 層級（優先用學員自己的，fallback 球隊；高中甲組、大專甲組等） */
  level?: string;
  /** 縣市（選擇球隊時自動帶入該球隊縣市，學員可手動覆寫） */
  county?: string;
  position: string;
  playerType: string;
  height: string;
  weight: string;
  birthday: string;
  email: string;
  throwingHand: string;
  battingHand: string;
  lastTest: string;
  lastTraining: string;
  teamCoaches: string[];
  responsibleCoaches: string[];
  password: string;
  requirePasswordChange: boolean;
  teamHistory?: TeamHistoryItem[];
}

export interface StudentFormInput {
  name: string;
  email: string;
  height?: string;
  weight?: string;
  birthday?: string;
  position?: string;
  playerType?: string;
  throwingHand?: string;
  battingHand?: string;
  /** 學員層級（建立時必填，可手動切換） */
  level?: string;
  /** 學員縣市（選擇球隊時自動帶入，可手動覆寫） */
  county?: string;
  teamId: string;
  responsibleCoaches: string[];
}

// ============= Context =============
interface StudentsContextType {
  students: StudentData[];
  archivedStudents: StudentData[];
  isLoading: boolean;
  hasCoachDataError: boolean;
  refetchCoachData: () => void;
  getStudentById: (id: string) => StudentData | undefined;
  getStudentsByTeam: (teamId: string) => StudentData[];
  addStudent: (input: StudentFormInput) => Promise<StudentData>;
  updateStudent: (id: string, input: StudentFormInput) => Promise<StudentData | undefined>;
  deleteStudent: (id: string) => Promise<boolean>;
  archiveStudent: (id: string) => Promise<boolean>;
  unarchiveStudent: (id: string) => Promise<boolean>;
  resetStudentPassword: (id: string) => boolean;
  updateStudentPassword: (id: string, newPassword: string) => boolean;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

// ============= Provider =============
export const StudentsProvider = ({ children }: { children: ReactNode }) => {
  // Fetch data from Supabase
  const { data: studentsData, isLoading: studentsLoading } = useSupabaseStudentsQuery();
  const { data: archivedStudentsData, isLoading: archivedLoading } = useSupabaseArchivedStudentsQuery();
  const { data: teamsData, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = useSupabaseTeamsQuery();
  const { data: accountsData, isLoading: accountsLoading, error: accountsError, refetch: refetchAccounts } = useSupabaseAccountsQuery();
  
  // Mutations
  const createStudentAccount = useCreateStudentAccount();
  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();
  const archiveStudentMutation = useArchiveStudentMutation();
  
  const isLoading = studentsLoading || teamsLoading || accountsLoading;
  
  // Coach data error detection
  const hasCoachDataError = !!(accountsError || teamsError);
  
  const refetchCoachData = () => {
    refetchTeams();
    refetchAccounts();
  };
  
  // Helper functions
  const getTeamName = (teamId: string): string => {
    return (teamsData || []).find((t) => t.id === teamId)?.name || "";
  };

  const getTeamAttribute = (teamId: string): string | undefined => {
    return (teamsData || []).find((t) => t.id === teamId)?.attribute || undefined;
  };

  const getTeamLevel = (teamId: string): string | undefined => {
    return (teamsData || []).find((t) => t.id === teamId)?.level || undefined;
  };

  const getTeamCounty = (teamId: string): string | undefined => {
    const team = (teamsData || []).find((t) => t.id === teamId);
    if (!team) return undefined;
    // county 欄位 DB 尚未建立，目前透過 type cast 安全讀取（teams 表會由前端 mock 帶入）
    return ((team as Record<string, unknown>).county as string | undefined) || undefined;
  };
  
  const getTeamCoachNames = (teamId: string): string[] => {
    const team = (teamsData || []).find((t) => t.id === teamId);
    if (!team) return [];
    return (accountsData || [])
      .filter((acc) => team.coachIds.includes(acc.id))
      .map((acc) => acc.name);
  };
  
  const getCoachNames = (coachIds: string[]): string[] => {
    return (accountsData || [])
      .filter((acc) => coachIds.includes(acc.id))
      .map((acc) => acc.name);
  };
  
  // Convert database student to frontend format
  const convertStudent = (student: StudentWithCoaches): StudentData => ({
    id: student.id,
    name: student.name,
    email: student.email,
    teamId: student.team_id || "",
    teamName: getTeamName(student.team_id || ""),
    // 優先用學員自己的 level（DB 加欄後生效），否則 fallback 為球隊 level
    level: ((student as { level?: string }).level) || getTeamLevel(student.team_id || ""),
    // 優先用學員自己的 county（DB 加欄後生效），否則 fallback 為球隊 county
    county: ((student as { county?: string }).county) || getTeamCounty(student.team_id || ""),
    position: student.position || "",
    playerType: (student as any).player_type || "",
    height: student.height || "",
    weight: student.weight || "",
    birthday: student.birthday || "",
    throwingHand: student.throwing_hand || "",
    battingHand: student.batting_hand || "",
    lastTest: student.last_test || "-",
    lastTraining: student.last_training || "-",
    teamCoaches: getTeamCoachNames(student.team_id || ""),
    responsibleCoaches: getCoachNames(student.responsibleCoachIds),
    password: "000000",
    requirePasswordChange: false,
  });
  
  // Convert data to frontend format
  const students = useMemo(() => 
    (studentsData || []).map(convertStudent), 
    [studentsData, teamsData, accountsData]
  );

  const archivedStudents = useMemo(() => 
    (archivedStudentsData || []).map(convertStudent), 
    [archivedStudentsData, teamsData, accountsData]
  );

  const getStudentById = (id: string): StudentData | undefined => {
    return students.find((s) => s.id === id) || archivedStudents.find((s) => s.id === id);
  };

  const getStudentsByTeam = (teamId: string): StudentData[] => {
    return students.filter((s) => s.teamId === teamId);
  };

  const addStudent = async (input: StudentFormInput): Promise<StudentData> => {
    // Find coach IDs from names
    const coachIds = (accountsData || [])
      .filter((acc) => input.responsibleCoaches.includes(acc.name) || input.responsibleCoaches.includes(acc.id))
      .map((acc) => acc.id);
    
    // Use Edge Function to create student with auth account
    const result = await createStudentAccount.mutateAsync({
      name: input.name,
      email: input.email,
      team_id: input.teamId,
      position: input.position,
      player_type: input.playerType,
      height: input.height,
      weight: input.weight,
      birthday: input.birthday,
      throwing_hand: input.throwingHand,
      batting_hand: input.battingHand,
      responsibleCoachIds: coachIds,
    });
    
    return {
      id: result.studentId,
      name: input.name,
      email: input.email,
      teamId: input.teamId,
      teamName: getTeamName(input.teamId),
      level: input.level || getTeamLevel(input.teamId),
      county: input.county || getTeamCounty(input.teamId),
      position: input.position || "",
      playerType: input.playerType || "",
      height: input.height || "",
      weight: input.weight || "",
      birthday: input.birthday || "",
      throwingHand: input.throwingHand || "",
      battingHand: input.battingHand || "",
      lastTest: "-",
      lastTraining: "-",
      teamCoaches: getTeamCoachNames(input.teamId),
      responsibleCoaches: getCoachNames(coachIds),
      password: "000000",
      requirePasswordChange: true,
    };
  };

  const updateStudent = async (id: string, input: StudentFormInput): Promise<StudentData | undefined> => {
    // Only update basic student fields - coaches are managed via team history
    await updateStudentMutation.mutateAsync({
      id,
      name: input.name,
      email: input.email,
      team_id: input.teamId,
      position: input.position,
      player_type: input.playerType,
      height: input.height,
      weight: input.weight,
      birthday: input.birthday,
      throwing_hand: input.throwingHand,
      batting_hand: input.battingHand,
    });

    const coachIds = (accountsData || [])
      .filter((acc) => input.responsibleCoaches.includes(acc.name) || input.responsibleCoaches.includes(acc.id))
      .map((acc) => acc.id);
    
    const existingStudent = students.find((s) => s.id === id);
    if (!existingStudent) return undefined;
    
    return {
      ...existingStudent,
      name: input.name,
      email: input.email,
      teamId: input.teamId,
      teamName: getTeamName(input.teamId),
      level: input.level || getTeamLevel(input.teamId),
      county: input.county || getTeamCounty(input.teamId),
      position: input.position || "",
      playerType: input.playerType || "",
      height: input.height || "",
      weight: input.weight || "",
      birthday: input.birthday || "",
      throwingHand: input.throwingHand || "",
      battingHand: input.battingHand || "",
      teamCoaches: getTeamCoachNames(input.teamId),
      responsibleCoaches: getCoachNames(coachIds),
    };
  };

  const deleteStudent = async (id: string): Promise<boolean> => {
    try {
      await deleteStudentMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const resetStudentPassword = (id: string): boolean => {
    console.log("Reset password for student:", id);
    return true;
  };

  const updateStudentPassword = (id: string, newPassword: string): boolean => {
    console.log("Update password for student:", id, "to", newPassword);
    return true;
  };

  const archiveStudent = async (id: string): Promise<boolean> => {
    try {
      await archiveStudentMutation.mutateAsync({ id, archived: true });
      return true;
    } catch {
      return false;
    }
  };

  const unarchiveStudent = async (id: string): Promise<boolean> => {
    try {
      await archiveStudentMutation.mutateAsync({ id, archived: false });
      return true;
    } catch {
      return false;
    }
  };

  const value = useMemo(
    () => ({
      students,
      archivedStudents,
      isLoading,
      hasCoachDataError,
      refetchCoachData,
      getStudentById,
      getStudentsByTeam,
      addStudent,
      updateStudent,
      deleteStudent,
      archiveStudent,
      unarchiveStudent,
      resetStudentPassword,
      updateStudentPassword,
    }),
    [students, archivedStudents, isLoading, hasCoachDataError]
  );

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
};

// ============= Hook =============
export const useStudents = (): StudentsContextType => {
  const context = useContext(StudentsContext);
  if (!context) {
    throw new Error("useStudents must be used within a StudentsProvider");
  }
  return context;
};
