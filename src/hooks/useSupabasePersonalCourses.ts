import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ============= Types =============

export interface PersonalCourseRow {
  id: string;
  name: string;
  category: string;
  notes: string | null;
  color: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalCourseActionRow {
  id: string;
  course_id: string;
  action_id: string;
  sort_order: number | null;
  created_at: string;
}

export interface PersonalTemplateCategoryRow {
  id: string;
  name: string;
  owner_id: string;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalCourseWithActions extends PersonalCourseRow {
  actionIds: string[];
}

// ============= Personal Courses Queries =============

export const usePersonalCourses = () => {
  const { authUser } = useAuth();
  
  return useQuery({
    queryKey: ["personal_courses", authUser?.id],
    queryFn: async (): Promise<PersonalCourseWithActions[]> => {
      // Fetch personal courses owned by current user
      const { data: courses, error } = await supabase
        .from("personal_courses")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch all course actions for these courses
      const courseIds = (courses || []).map((c) => c.id);
      if (courseIds.length === 0) return [];

      const { data: actions, error: actionsError } = await supabase
        .from("personal_course_actions")
        .select("*")
        .in("course_id", courseIds)
        .order("sort_order");

      if (actionsError) throw actionsError;

      // Build action map
      const actionMap: Record<string, string[]> = {};
      (actions || []).forEach((action) => {
        if (!actionMap[action.course_id]) actionMap[action.course_id] = [];
        actionMap[action.course_id].push(action.action_id);
      });

      return (courses || []).map((course) => ({
        ...course,
        actionIds: actionMap[course.id] || [],
      }));
    },
    enabled: !!authUser?.id,
  });
};

export const usePersonalCourseById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["personal_courses", id],
    queryFn: async (): Promise<PersonalCourseWithActions | null> => {
      if (!id) return null;

      const { data: course, error } = await supabase
        .from("personal_courses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!course) return null;

      // Fetch actions for this course
      const { data: actions, error: actionsError } = await supabase
        .from("personal_course_actions")
        .select("action_id")
        .eq("course_id", id)
        .order("sort_order");

      if (actionsError) throw actionsError;

      return {
        ...course,
        actionIds: (actions || []).map((a) => a.action_id),
      };
    },
    enabled: !!id,
  });
};

// ============= Personal Template Categories =============

export const usePersonalTemplateCategories = () => {
  const { authUser } = useAuth();
  
  return useQuery({
    queryKey: ["personal_template_categories", authUser?.id],
    queryFn: async (): Promise<PersonalTemplateCategoryRow[]> => {
      const { data, error } = await supabase
        .from("personal_template_categories")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return data || [];
    },
    enabled: !!authUser?.id,
  });
};

// ============= Mutations =============

export const useAddPersonalCourse = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      category: string;
      notes?: string;
      color?: string;
      actionIds: string[];
      courseActions?: { actionId: string; sortOrder: number; sets: number; reps: number; intensity: number }[];
    }) => {
      if (!authUser?.id) throw new Error("User not authenticated");

      // Insert personal course
      const { error } = await supabase.from("personal_courses").insert({
        id: data.id,
        name: data.name,
        category: data.category,
        notes: data.notes || null,
        color: data.color || "red",
        owner_id: authUser.id,
      });

      if (error) throw error;

      // Insert course actions with custom params if provided
      if (data.courseActions && data.courseActions.length > 0) {
        const courseActions = data.courseActions.map((ca) => ({
          course_id: data.id,
          action_id: ca.actionId,
          sort_order: ca.sortOrder,
          sets: ca.sets,
          reps: ca.reps,
          intensity: ca.intensity,
        }));

        const { error: actionsError } = await supabase
          .from("personal_course_actions")
          .insert(courseActions);

        if (actionsError) throw actionsError;
      } else if (data.actionIds.length > 0) {
        // Fallback to actionIds only
        const courseActions = data.actionIds.map((actionId, index) => ({
          course_id: data.id,
          action_id: actionId,
          sort_order: index,
        }));

        const { error: actionsError } = await supabase
          .from("personal_course_actions")
          .insert(courseActions);

        if (actionsError) throw actionsError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_courses"] });
    },
  });
};

export const useUpdatePersonalCourse = () => {
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
      const { id, actionIds, courseActions, ...updates } = data;

      // Update course fields if provided
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("personal_courses")
          .update(updates)
          .eq("id", id);

        if (error) throw error;
      }

      // Update actions if courseActions or actionIds provided
      if (courseActions !== undefined || actionIds !== undefined) {
        // Delete existing actions
        const { error: deleteError } = await supabase
          .from("personal_course_actions")
          .delete()
          .eq("course_id", id);

        if (deleteError) throw deleteError;

        // Insert new actions with custom params
        if (courseActions && courseActions.length > 0) {
          const newCourseActions = courseActions.map((ca) => ({
            course_id: id,
            action_id: ca.actionId,
            sort_order: ca.sortOrder,
            sets: ca.sets,
            reps: ca.reps,
            intensity: ca.intensity,
          }));

          const { error: insertError } = await supabase
            .from("personal_course_actions")
            .insert(newCourseActions);

          if (insertError) throw insertError;
        } else if (actionIds && actionIds.length > 0) {
          // Fallback to actionIds only
          const newCourseActions = actionIds.map((actionId, index) => ({
            course_id: id,
            action_id: actionId,
            sort_order: index,
          }));

          const { error: insertError } = await supabase
            .from("personal_course_actions")
            .insert(newCourseActions);

          if (insertError) throw insertError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_courses"] });
    },
  });
};

export const useDeletePersonalCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Actions will be cascade deleted by foreign key
      const { error } = await supabase
        .from("personal_courses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_courses"] });
    },
  });
};

// ============= Category Mutations =============

export const useAddPersonalTemplateCategory = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; sort_order?: number }) => {
      if (!authUser?.id) throw new Error("User not authenticated");

      const { data: result, error } = await supabase
        .from("personal_template_categories")
        .insert({
          name: data.name,
          owner_id: authUser.id,
          sort_order: data.sort_order ?? 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_template_categories"] });
    },
  });
};

export const useUpdatePersonalTemplateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; sort_order?: number }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("personal_template_categories")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_template_categories"] });
    },
  });
};

export const useDeletePersonalTemplateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("personal_template_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_template_categories"] });
    },
  });
};

export const useReorderPersonalTemplateCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedCategories: { id: string; sort_order: number }[]) => {
      for (const cat of orderedCategories) {
        const { error } = await supabase
          .from("personal_template_categories")
          .update({ sort_order: cat.sort_order })
          .eq("id", cat.id);

        if (error) throw error;
      }
      return orderedCategories;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_template_categories"] });
    },
  });
};

// ============= Accessible Personal Courses (for viewing in schedule) =============

// This fetches personal courses that the user can see through schedule access
export const useAccessiblePersonalCourses = () => {
  return useQuery({
    queryKey: ["accessible_personal_courses"],
    queryFn: async (): Promise<PersonalCourseWithActions[]> => {
      // This query relies on RLS to filter accessible courses
      const { data: courses, error } = await supabase
        .from("personal_courses")
        .select("*")
        .order("name");

      if (error) throw error;

      if (!courses || courses.length === 0) return [];

      // Fetch all course actions for these courses
      const courseIds = courses.map((c) => c.id);

      const { data: actions, error: actionsError } = await supabase
        .from("personal_course_actions")
        .select("*")
        .in("course_id", courseIds)
        .order("sort_order");

      if (actionsError) throw actionsError;

      // Build action map
      const actionMap: Record<string, string[]> = {};
      (actions || []).forEach((action) => {
        if (!actionMap[action.course_id]) actionMap[action.course_id] = [];
        actionMap[action.course_id].push(action.action_id);
      });

      return courses.map((course) => ({
        ...course,
        actionIds: actionMap[course.id] || [],
      }));
    },
  });
};
