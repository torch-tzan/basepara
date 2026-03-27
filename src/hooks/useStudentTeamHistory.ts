import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudentTeamHistoryRow {
  id: string;
  student_id: string;
  team_id: string;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamHistoryWithCoaches extends StudentTeamHistoryRow {
  responsibleCoachIds: string[];
}

// Helper to query the new table (not yet in auto-generated types)
const fromTeamHistory = () => supabase.from("student_team_history" as any);
const fromStudentCoaches = () => supabase.from("student_coaches");

// ============= Queries =============

export const useStudentTeamHistory = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ["student_team_history", studentId],
    queryFn: async (): Promise<TeamHistoryWithCoaches[]> => {
      if (!studentId) return [];

      const { data: histories, error } = await fromTeamHistory()
        .select("*")
        .eq("student_id", studentId)
        .order("is_current", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      const historyIds = (histories || []).map((h: any) => h.id);
      if (historyIds.length === 0) return [];

      const { data: coaches, error: coachError } = await fromStudentCoaches()
        .select("*")
        .in("team_history_id", historyIds);

      if (coachError) throw coachError;

      return (histories || []).map((h: any) => ({
        ...h,
        responsibleCoachIds: (coaches || [])
          .filter((c) => c.team_history_id === h.id)
          .map((c) => c.coach_id),
      }));
    },
    enabled: !!studentId,
  });
};

// ============= Mutations =============

export const useAddTeamHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      student_id: string;
      team_id: string;
      responsibleCoachIds: string[];
      start_date?: string;
    }) => {
      // Set all existing current records to not current
      const { error: updateError } = await fromTeamHistory()
        .update({ is_current: false, end_date: new Date().toISOString().split("T")[0] } as any)
        .eq("student_id", data.student_id)
        .eq("is_current", true);

      if (updateError) throw updateError;

      // Insert new current record
      const { data: newHistory, error: insertError } = await fromTeamHistory()
        .insert({
          student_id: data.student_id,
          team_id: data.team_id,
          is_current: true,
          start_date: data.start_date || new Date().toISOString().split("T")[0],
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert coach assignments linked to this history
      if (data.responsibleCoachIds.length > 0) {
        const { error: coachError } = await fromStudentCoaches()
          .insert(
            data.responsibleCoachIds.map((coachId) => ({
              student_id: data.student_id,
              coach_id: coachId,
              team_history_id: (newHistory as any).id,
            }))
          );

        if (coachError) throw coachError;
      }

      // Also update students.team_id for backward compatibility
      const { error: studentError } = await supabase
        .from("students")
        .update({ team_id: data.team_id })
        .eq("id", data.student_id);

      if (studentError) throw studentError;

      return newHistory;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student_team_history", variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateCurrentTeamHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      history_id: string;
      student_id: string;
      team_id: string;
      responsibleCoachIds: string[];
    }) => {
      // Update team_id on history record
      const { error: historyError } = await fromTeamHistory()
        .update({ team_id: data.team_id } as any)
        .eq("id", data.history_id);

      if (historyError) throw historyError;

      // Delete existing coaches for this history
      const { error: deleteError } = await fromStudentCoaches()
        .delete()
        .eq("team_history_id", data.history_id);

      if (deleteError) throw deleteError;

      // Insert new coaches
      if (data.responsibleCoachIds.length > 0) {
        const { error: coachError } = await fromStudentCoaches()
          .insert(
            data.responsibleCoachIds.map((coachId) => ({
              student_id: data.student_id,
              coach_id: coachId,
              team_history_id: data.history_id,
            }))
          );

        if (coachError) throw coachError;
      }

      // Update students.team_id
      const { error: studentError } = await supabase
        .from("students")
        .update({ team_id: data.team_id })
        .eq("id", data.student_id);

      if (studentError) throw studentError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student_team_history", variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useDeleteTeamHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { history_id: string; student_id: string }) => {
      // Delete associated student_coaches first
      const { error: coachDeleteError } = await fromStudentCoaches()
        .delete()
        .eq("team_history_id", data.history_id);

      if (coachDeleteError) throw coachDeleteError;

      // Delete the history record
      const { error: historyDeleteError } = await fromTeamHistory()
        .delete()
        .eq("id", data.history_id);

      if (historyDeleteError) throw historyDeleteError;

      // Find the remaining newest record and set it as current
      const { data: remaining, error: fetchError } = await fromTeamHistory()
        .select("*")
        .eq("student_id", data.student_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (remaining && remaining.length > 0) {
        const newest = remaining[0] as any;
        // Reset all to not current, then set newest
        await fromTeamHistory()
          .update({ is_current: false } as any)
          .eq("student_id", data.student_id);

        await fromTeamHistory()
          .update({ is_current: true, end_date: null } as any)
          .eq("id", newest.id);

        // Sync students.team_id
        await supabase
          .from("students")
          .update({ team_id: newest.team_id })
          .eq("id", data.student_id);
      } else {
        // No remaining records, clear team_id
        await supabase
          .from("students")
          .update({ team_id: null })
          .eq("id", data.student_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student_team_history", variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateTeamHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      history_id: string;
      student_id: string;
      team_id: string;
      responsibleCoachIds: string[];
      is_current: boolean;
    }) => {
      // Update team_id on history record
      const { error: historyError } = await fromTeamHistory()
        .update({ team_id: data.team_id } as any)
        .eq("id", data.history_id);

      if (historyError) throw historyError;

      // Update coaches (delete and re-insert)
      const { error: deleteError } = await fromStudentCoaches()
        .delete()
        .eq("team_history_id", data.history_id);

      if (deleteError) throw deleteError;

      if (data.responsibleCoachIds.length > 0) {
        const { error: coachError } = await fromStudentCoaches()
          .insert(
            data.responsibleCoachIds.map((coachId) => ({
              student_id: data.student_id,
              coach_id: coachId,
              team_history_id: data.history_id,
            }))
          );
        if (coachError) throw coachError;
      }

      // If it is the current record, sync with students table
      if (data.is_current) {
        const { error: studentError } = await supabase
          .from("students")
          .update({ team_id: data.team_id })
          .eq("id", data.student_id);

        if (studentError) throw studentError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student_team_history", variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useSetCurrentTeamHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { history_id: string; student_id: string; team_id: string }) => {
      // Set all records for this student to not current
      const { error: resetError } = await fromTeamHistory()
        .update({ is_current: false, end_date: new Date().toISOString().split("T")[0] } as any)
        .eq("student_id", data.student_id)
        .eq("is_current", true);

      if (resetError) throw resetError;

      // Set the target record as current
      const { error: setError } = await fromTeamHistory()
        .update({ is_current: true, end_date: null } as any)
        .eq("id", data.history_id);

      if (setError) throw setError;

      // Sync students.team_id
      const { error: studentError } = await supabase
        .from("students")
        .update({ team_id: data.team_id })
        .eq("id", data.student_id);

      if (studentError) throw studentError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["student_team_history", variables.student_id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
