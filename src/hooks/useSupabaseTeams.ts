import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type TeamRow = Tables<"teams">;
export type AccountTeamRow = Tables<"account_teams">;

export interface TeamWithCoaches extends TeamRow {
  coachIds: string[];
}

// Fetch all teams with their coach assignments
export const useTeams = () => {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<TeamWithCoaches[]> => {
      // Fetch teams
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("*")
        .order("name");

      if (teamsError) throw teamsError;

      // Fetch account_teams relationships
      const { data: accountTeams, error: atError } = await supabase
        .from("account_teams")
        .select("*");

      if (atError) throw atError;

      // Map teams with their coach IDs
      return (teams || []).map((team) => ({
        ...team,
        coachIds: (accountTeams || [])
          .filter((at) => at.team_id === team.id)
          .map((at) => at.account_id),
      }));
    },
  });
};

// Fetch a single team by ID
export const useTeamById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["teams", id],
    queryFn: async (): Promise<TeamWithCoaches | null> => {
      if (!id) return null;

      const { data: team, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!team) return null;

      // Fetch coach assignments
      const { data: accountTeams, error: atError } = await supabase
        .from("account_teams")
        .select("account_id")
        .eq("team_id", id);

      if (atError) throw atError;

      return {
        ...team,
        coachIds: (accountTeams || []).map((at) => at.account_id),
      };
    },
    enabled: !!id,
  });
};

// Add team mutation
export const useAddTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; level?: string; attribute?: string; coachIds: string[] }) => {
      // Insert team
      const { error: teamError } = await supabase
        .from("teams")
        .insert({ id: data.id, name: data.name, level: data.level, attribute: data.attribute });

      if (teamError) throw teamError;

      // Insert coach assignments
      if (data.coachIds.length > 0) {
        const { error: atError } = await supabase
          .from("account_teams")
          .insert(
            data.coachIds.map((coachId) => ({
              account_id: coachId,
              team_id: data.id,
            }))
          );

        if (atError) throw atError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};

// Update team mutation
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; level?: string; attribute?: string; coachIds?: string[] }) => {
      // Update team fields if provided
      if (data.name !== undefined || data.level !== undefined || data.attribute !== undefined) {
        const updateData: { name?: string; level?: string; attribute?: string } = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.level !== undefined) updateData.level = data.level;
        if (data.attribute !== undefined) updateData.attribute = data.attribute;
        
        const { error: teamError } = await supabase
          .from("teams")
          .update(updateData)
          .eq("id", data.id);

        if (teamError) throw teamError;
      }

      // Update coach assignments if provided
      if (data.coachIds !== undefined) {
        // Delete existing assignments
        const { error: deleteError } = await supabase
          .from("account_teams")
          .delete()
          .eq("team_id", data.id);

        if (deleteError) throw deleteError;

        // Insert new assignments
        if (data.coachIds.length > 0) {
          const { error: insertError } = await supabase
            .from("account_teams")
            .insert(
              data.coachIds.map((coachId) => ({
                account_id: coachId,
                team_id: data.id,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["teams", variables.id] });
    },
  });
};

// Delete team mutation
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
};
