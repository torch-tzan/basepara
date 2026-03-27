import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CommentRow = Tables<"course_comments">;

export interface Comment {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  userRole: "student" | "coach";
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// Transform DB row to Comment interface
const transformComment = (row: CommentRow): Comment => ({
  id: row.id,
  courseId: row.course_id,
  userId: row.user_id,
  userName: row.user_name,
  userRole: row.user_role === "student" ? "student" : "coach",
  content: row.content,
  createdAt: new Date(row.created_at).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }),
  updatedAt: row.updated_at !== row.created_at
    ? new Date(row.updated_at).toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined,
});

// ============= Query: Fetch comments by course =============
export const useCourseComments = (courseId: string) => {
  return useQuery({
    queryKey: ["course_comments", courseId],
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("course_comments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(transformComment);
    },
    enabled: !!courseId,
  });
};

// ============= Mutation: Add comment =============
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      course_id: string;
      user_id: string;
      user_name: string;
      user_role: string;
      content: string;
    }) => {
      const { data: result, error } = await supabase
        .from("course_comments")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course_comments", data.course_id] });
    },
  });
};

// ============= Mutation: Update comment =============
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; content: string; course_id: string }) => {
      const { error } = await supabase
        .from("course_comments")
        .update({ content: data.content, updated_at: new Date().toISOString() })
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course_comments", data.course_id] });
    },
  });
};

// ============= Mutation: Delete comment =============
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; course_id: string }) => {
      const { error } = await supabase
        .from("course_comments")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["course_comments", data.course_id] });
    },
  });
};
