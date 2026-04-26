import { createContext, useContext, useMemo, ReactNode } from "react";
import {
  useTeams as useSupabaseTeamsQuery,
  useAddTeam,
  useUpdateTeam,
  useDeleteTeam,
  type TeamWithCoaches,
} from "@/hooks/useSupabaseTeams";
import { useAccounts as useSupabaseAccountsQuery } from "@/hooks/useSupabaseAccounts";

export interface Team {
  id: string;
  name: string;
  level?: string;
  attribute?: string;
  /** 所屬縣市（非必填，用於成績比較 & 報告篩選） */
  county?: string;
  coachIds: string[];
}

export interface AccountData {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  teams?: string[];
}

interface TeamsContextType {
  teams: Team[];
  isLoading: boolean;
  getTeamById: (id: string) => Team | undefined;
  addTeam: (team: Omit<Team, "id">) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Omit<Team, "id">>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  getCoachesByTeam: (teamId: string) => AccountData[];
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

// Convert database team to frontend format
const convertTeam = (team: TeamWithCoaches): Team => ({
  id: team.id,
  name: team.name,
  level: team.level || undefined,
  attribute: team.attribute || undefined,
  county: (team as Record<string, unknown>).county as string | undefined,
  coachIds: team.coachIds,
});

export const TeamsProvider = ({ children }: { children: ReactNode }) => {
  // Fetch data from Supabase
  const { data: teamsData, isLoading: teamsLoading } = useSupabaseTeamsQuery();
  const { data: accountsData, isLoading: accountsLoading } = useSupabaseAccountsQuery();
  
  // Mutations
  const addTeamMutation = useAddTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();
  
  // Convert data to frontend format
  const teams = useMemo(() => 
    (teamsData || []).map(convertTeam), 
    [teamsData]
  );
  
  const isLoading = teamsLoading || accountsLoading;

  const getTeamById = (id: string) => teams.find((t) => t.id === id);

  const addTeam = async (teamData: Omit<Team, "id">): Promise<Team> => {
    const newId = `team_${Date.now()}`;
    await addTeamMutation.mutateAsync({
      id: newId,
      name: teamData.name,
      level: teamData.level,
      attribute: teamData.attribute,
      coachIds: teamData.coachIds,
    });
    return { id: newId, ...teamData };
  };

  const updateTeam = async (id: string, updates: Partial<Omit<Team, "id">>) => {
    await updateTeamMutation.mutateAsync({
      id,
      name: updates.name,
      level: updates.level,
      attribute: updates.attribute,
      coachIds: updates.coachIds,
    });
  };

  const deleteTeam = async (id: string) => {
    await deleteTeamMutation.mutateAsync(id);
  };

  const getCoachesByTeam = (teamId: string): AccountData[] => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return [];
    return (accountsData || [])
      .filter((acc) => team.coachIds.includes(acc.id))
      .map((acc) => ({
        id: acc.id,
        name: acc.name,
        email: acc.email,
        roleId: acc.role_id,
        active: acc.active ?? true,
        teams: acc.teams,
      }));
  };

  const value = useMemo(
    () => ({
      teams,
      isLoading,
      getTeamById,
      addTeam,
      updateTeam,
      deleteTeam,
      getCoachesByTeam,
    }),
    [teams, isLoading, accountsData]
  );

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>;
};

export const useTeams = () => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error("useTeams must be used within a TeamsProvider");
  }
  return context;
};
