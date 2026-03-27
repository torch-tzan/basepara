import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type StudentRow = Tables<"students">;
export type StudentCoachRow = Tables<"student_coaches">;

export interface StudentWithCoaches extends StudentRow {
  responsibleCoachIds: string[];
}

// ============= Queries =============

export const useStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async (): Promise<StudentWithCoaches[]> => {
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("archived", false)
        .order("name");

      if (studentsError) throw studentsError;

      const { data: studentCoaches, error: scError } = await supabase
        .from("student_coaches")
        .select("*");

      if (scError) throw scError;

      return (students || []).map((student) => ({
        ...student,
        responsibleCoachIds: (studentCoaches || [])
          .filter((sc) => sc.student_id === student.id)
          .map((sc) => sc.coach_id),
      }));
    },
  });
};

export const useStudentById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["students", id],
    queryFn: async (): Promise<StudentWithCoaches | null> => {
      if (!id) return null;

      const { data: student, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!student) return null;

      const { data: studentCoaches, error: scError } = await supabase
        .from("student_coaches")
        .select("coach_id")
        .eq("student_id", id);

      if (scError) throw scError;

      return {
        ...student,
        responsibleCoachIds: (studentCoaches || []).map((sc) => sc.coach_id),
      };
    },
    enabled: !!id,
  });
};

export const useStudentsByTeam = (teamId: string | undefined) => {
  return useQuery({
    queryKey: ["students", "team", teamId],
    queryFn: async (): Promise<StudentWithCoaches[]> => {
      if (!teamId) return [];

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("team_id", teamId)
        .order("name");

      if (studentsError) throw studentsError;

      const studentIds = (students || []).map((s) => s.id);
      if (studentIds.length === 0) return [];

      const { data: studentCoaches, error: scError } = await supabase
        .from("student_coaches")
        .select("*")
        .in("student_id", studentIds);

      if (scError) throw scError;

      return (students || []).map((student) => ({
        ...student,
        responsibleCoachIds: (studentCoaches || [])
          .filter((sc) => sc.student_id === student.id)
          .map((sc) => sc.coach_id),
      }));
    },
    enabled: !!teamId,
  });
};

// ============= Mutations =============

export const useAddStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      email: string;
      team_id?: string;
      position?: string;
      player_type?: string;
      height?: string;
      weight?: string;
      birthday?: string;
      throwing_hand?: string;
      batting_hand?: string;
      last_test?: string;
      responsibleCoachIds?: string[];
    }) => {
      // Insert student
      const { error: studentError } = await supabase
        .from("students")
        .insert({
          id: data.id,
          name: data.name,
          email: data.email,
          team_id: data.team_id,
          position: data.position,
          player_type: data.player_type,
          height: data.height,
          weight: data.weight,
          birthday: data.birthday,
          throwing_hand: data.throwing_hand,
          batting_hand: data.batting_hand,
          last_test: data.last_test,
        });

      if (studentError) throw studentError;

      // Insert coach assignments
      if (data.responsibleCoachIds && data.responsibleCoachIds.length > 0) {
        const { error: scError } = await supabase
          .from("student_coaches")
          .insert(
            data.responsibleCoachIds.map((coachId) => ({
              student_id: data.id,
              coach_id: coachId,
            }))
          );

        if (scError) throw scError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      email?: string;
      team_id?: string;
      position?: string;
      player_type?: string;
      height?: string;
      weight?: string;
      birthday?: string;
      throwing_hand?: string;
      batting_hand?: string;
      last_test?: string;
      responsibleCoachIds?: string[];
    }) => {
      // Build update object
      const updates: Partial<StudentRow> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.email !== undefined) updates.email = data.email;
      if (data.team_id !== undefined) updates.team_id = data.team_id;
      if (data.position !== undefined) updates.position = data.position;
      if ((data as any).player_type !== undefined) (updates as any).player_type = (data as any).player_type;
      if (data.height !== undefined) updates.height = data.height;
      if (data.weight !== undefined) updates.weight = data.weight;
      if (data.birthday !== undefined) updates.birthday = data.birthday;
      if (data.throwing_hand !== undefined) updates.throwing_hand = data.throwing_hand;
      if (data.batting_hand !== undefined) updates.batting_hand = data.batting_hand;
      if (data.last_test !== undefined) updates.last_test = data.last_test;

      if (Object.keys(updates).length > 0) {
        const { error: studentError } = await supabase
          .from("students")
          .update(updates)
          .eq("id", data.id);

        if (studentError) throw studentError;
      }

      // Update coach assignments if provided
      if (data.responsibleCoachIds !== undefined) {
        // Delete existing assignments
        const { error: deleteError } = await supabase
          .from("student_coaches")
          .delete()
          .eq("student_id", data.id);

        if (deleteError) throw deleteError;

        // Insert new assignments
        if (data.responsibleCoachIds.length > 0) {
          const { error: insertError } = await supabase
            .from("student_coaches")
            .insert(
              data.responsibleCoachIds.map((coachId) => ({
                student_id: data.id,
                coach_id: coachId,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students", variables.id] });
      if (variables.team_id) {
        queryClient.invalidateQueries({ queryKey: ["students", "team", variables.team_id] });
      }
    },
  });
};

export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

// ============= Archive =============

export const useArchivedStudents = () => {
  return useQuery({
    queryKey: ["students", "archived"],
    queryFn: async (): Promise<StudentWithCoaches[]> => {
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("archived", true)
        .order("name");

      if (studentsError) throw studentsError;

      const { data: studentCoaches, error: scError } = await supabase
        .from("student_coaches")
        .select("*");

      if (scError) throw scError;

      return (students || []).map((student) => ({
        ...student,
        responsibleCoachIds: (studentCoaches || [])
          .filter((sc) => sc.student_id === student.id)
          .map((sc) => sc.coach_id),
      }));
    },
  });
};

export const useArchiveStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from("students")
        .update({ archived } as any)
        .eq("id", id);
      if (error) throw error;
      return { id, archived };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
