import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TrainingActionRow = Tables<"training_actions">;
export type TrainingCourseRow = Tables<"training_courses">;
export type CourseActionRow = Tables<"course_actions">;
export type TemplateCategoryRow = Tables<"template_categories">;

export interface CourseWithActions extends TrainingCourseRow {
  actionIds: string[];
}

// ============= Training Actions =============

export const useTrainingActions = () => {
  return useQuery({
    queryKey: ["training_actions"],
    queryFn: async (): Promise<TrainingActionRow[]> => {
      const { data, error } = await supabase
        .from("training_actions")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useTrainingActionById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["training_actions", id],
    queryFn: async (): Promise<TrainingActionRow | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("training_actions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useAddTrainingAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<TrainingActionRow, "created_at" | "updated_at">) => {
      const { error } = await supabase.from("training_actions").insert(data);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_actions"] });
    },
  });
};

export const useUpdateTrainingAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string } & Partial<Omit<TrainingActionRow, "id" | "created_at" | "updated_at">>) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("training_actions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["training_actions"] });
      queryClient.invalidateQueries({ queryKey: ["training_actions", variables.id] });
    },
  });
};

export const useDeleteTrainingAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First remove from all course_actions
      const { error: caError } = await supabase
        .from("course_actions")
        .delete()
        .eq("action_id", id);

      if (caError) throw caError;

      // Then delete the action
      const { error } = await supabase.from("training_actions").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_actions"] });
      queryClient.invalidateQueries({ queryKey: ["training_courses"] });
    },
  });
};

// ============= Training Courses =============

export const useTrainingCourses = () => {
  return useQuery({
    queryKey: ["training_courses"],
    queryFn: async (): Promise<CourseWithActions[]> => {
      const { data: courses, error: coursesError } = await supabase
        .from("training_courses")
        .select("*")
        .order("name");

      if (coursesError) throw coursesError;

      const { data: courseActions, error: caError } = await supabase
        .from("course_actions")
        .select("*")
        .order("sort_order");

      if (caError) throw caError;

      return (courses || []).map((course) => ({
        ...course,
        actionIds: (courseActions || [])
          .filter((ca) => ca.course_id === course.id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((ca) => ca.action_id),
      }));
    },
  });
};

export const useTrainingCourseById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["training_courses", id],
    queryFn: async (): Promise<CourseWithActions | null> => {
      if (!id) return null;

      const { data: course, error } = await supabase
        .from("training_courses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!course) return null;

      const { data: courseActions, error: caError } = await supabase
        .from("course_actions")
        .select("*")
        .eq("course_id", id)
        .order("sort_order");

      if (caError) throw caError;

      return {
        ...course,
        actionIds: (courseActions || []).map((ca) => ca.action_id),
      };
    },
    enabled: !!id,
  });
};

export const useAddTrainingCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      category: string;
      notes?: string;
      color?: string;
      actionIds?: string[];
      courseActions?: { actionId: string; sortOrder: number; sets: number; reps: number; intensity: number }[];
    }) => {
      // Insert course
      const { error: courseError } = await supabase
        .from("training_courses")
        .insert({
          id: data.id,
          name: data.name,
          category: data.category,
          notes: data.notes,
          color: data.color || "red",
        });

      if (courseError) throw courseError;

      // Insert action assignments with custom params if provided
      if (data.courseActions && data.courseActions.length > 0) {
        const { error: caError } = await supabase
          .from("course_actions")
          .insert(
            data.courseActions.map((ca) => ({
              course_id: data.id,
              action_id: ca.actionId,
              sort_order: ca.sortOrder,
              sets: ca.sets,
              reps: ca.reps,
              intensity: ca.intensity,
            }))
          );

        if (caError) throw caError;
      } else if (data.actionIds && data.actionIds.length > 0) {
        // Fallback to actionIds only
        const { error: caError } = await supabase
          .from("course_actions")
          .insert(
            data.actionIds.map((actionId, index) => ({
              course_id: data.id,
              action_id: actionId,
              sort_order: index,
            }))
          );

        if (caError) throw caError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_courses"] });
    },
  });
};

export const useUpdateTrainingCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name?: string;
      category?: string;
      notes?: string;
      color?: string;
      actionIds?: string[];
      courseActions?: { actionId: string; sortOrder: number; sets: number; reps: number; intensity: number }[];
    }) => {
      // Build update object
      const updates: Partial<TrainingCourseRow> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.category !== undefined) updates.category = data.category;
      if (data.notes !== undefined) updates.notes = data.notes;
      if (data.color !== undefined) updates.color = data.color;

      if (Object.keys(updates).length > 0) {
        const { error: courseError } = await supabase
          .from("training_courses")
          .update(updates)
          .eq("id", data.id);

        if (courseError) throw courseError;
      }

      // Update action assignments if courseActions or actionIds provided
      if (data.courseActions !== undefined || data.actionIds !== undefined) {
        // Delete existing assignments
        const { error: deleteError } = await supabase
          .from("course_actions")
          .delete()
          .eq("course_id", data.id);

        if (deleteError) throw deleteError;

        // Insert new assignments with custom params
        if (data.courseActions && data.courseActions.length > 0) {
          const { error: insertError } = await supabase
            .from("course_actions")
            .insert(
              data.courseActions.map((ca) => ({
                course_id: data.id,
                action_id: ca.actionId,
                sort_order: ca.sortOrder,
                sets: ca.sets,
                reps: ca.reps,
                intensity: ca.intensity,
              }))
            );

          if (insertError) throw insertError;
        } else if (data.actionIds && data.actionIds.length > 0) {
          // Fallback to actionIds only
          const { error: insertError } = await supabase
            .from("course_actions")
            .insert(
              data.actionIds.map((actionId, index) => ({
                course_id: data.id,
                action_id: actionId,
                sort_order: index,
              }))
            );

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["training_courses"] });
      queryClient.invalidateQueries({ queryKey: ["training_courses", variables.id] });
    },
  });
};

export const useDeleteTrainingCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_courses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training_courses"] });
    },
  });
};

// ============= Template Categories =============

export const useTemplateCategories = (type?: "course" | "action") => {
  return useQuery({
    queryKey: ["template_categories", type],
    queryFn: async (): Promise<TemplateCategoryRow[]> => {
      let query = supabase.from("template_categories").select("*").order("sort_order");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAddTemplateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; type: string; sort_order?: number }) => {
      const { data: result, error } = await supabase
        .from("template_categories")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template_categories"] });
    },
  });
};

export const useUpdateTemplateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; sort_order?: number }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("template_categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template_categories"] });
    },
  });
};

export const useDeleteTemplateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("template_categories").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template_categories"] });
    },
  });
};

export const useReorderTemplateCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedCategories: { id: string; sort_order: number }[]) => {
      // Update each category's sort_order
      for (const cat of orderedCategories) {
        const { error } = await supabase
          .from("template_categories")
          .update({ sort_order: cat.sort_order })
          .eq("id", cat.id);

        if (error) throw error;
      }
      return orderedCategories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["template_categories"] });
    },
  });
};
