import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type NotificationRow = Tables<"notifications">;

export type NotificationType = "comment" | "mention" | "student_comment";

export interface Notification {
  id: string;
  type: NotificationType;
  courseId: string;
  courseName: string;
  commenterId: string;
  commenterName: string;
  commentPreview: string;
  createdAt: string;
  read: boolean;
  recipientId: string;
}

// Transform DB row to Notification interface
const transformNotification = (row: NotificationRow): Notification => ({
  id: row.id,
  type: row.type as NotificationType,
  courseId: row.course_id,
  courseName: row.course_name,
  commenterId: row.commenter_id,
  commenterName: row.commenter_name,
  commentPreview: row.comment_preview || "",
  createdAt: new Date(row.created_at).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }),
  read: row.read || false,
  recipientId: row.recipient_id,
});

// ============= Query: Fetch notifications for current user =============
export const useNotifications = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async (): Promise<Notification[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(transformNotification);
    },
    enabled: !!userId,
  });
};

// ============= Mutation: Add notification =============
export const useAddNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: string;
      course_id: string;
      course_name: string;
      commenter_id: string;
      commenter_name: string;
      comment_preview: string;
      recipient_id: string;
    }) => {
      const { data: result, error } = await supabase
        .from("notifications")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", data.recipient_id] });
    },
  });
};

// ============= Mutation: Mark notification as read =============
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; recipient_id: string }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", data.id);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", data.recipient_id] });
    },
  });
};

// ============= Mutation: Mark all notifications as read =============
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", userId)
        .eq("read", false);

      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
  });
};

// ============= Helper: Get coaches for a student =============
export const getStudentCoachIds = async (studentId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("student_coaches")
    .select("coach_id")
    .eq("student_id", studentId);

  if (error) {
    console.error("Failed to fetch student coaches:", error);
    return [];
  }

  return (data || []).map((row) => row.coach_id);
};

// ============= Helper: Create notifications for course participants =============
// This should be called when adding a comment to notify other participants
export const createCommentNotifications = async (
  courseId: string,
  courseName: string,
  commenterId: string,
  commenterName: string,
  commentPreview: string,
  recipientIds: string[]
) => {
  // Filter out the commenter from recipients
  const validRecipients = recipientIds.filter((id) => id !== commenterId);
  
  if (validRecipients.length === 0) return;

  const notifications = validRecipients.map((recipientId) => ({
    type: "comment",
    course_id: courseId,
    course_name: courseName,
    commenter_id: commenterId,
    commenter_name: commenterName,
    comment_preview: commentPreview.length > 50 
      ? commentPreview.slice(0, 50) + "..." 
      : commentPreview,
    recipient_id: recipientId,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to create notifications:", error);
};

// ============= Helper: Create mention notifications =============
// This should be called when a user is mentioned in a comment
export const createMentionNotifications = async (
  courseId: string,
  courseName: string,
  mentionerId: string,
  mentionerName: string,
  commentPreview: string,
  mentionedUserIds: string[]
) => {
  // Filter out the mentioner from recipients
  const validRecipients = mentionedUserIds.filter((id) => id !== mentionerId);
  
  if (validRecipients.length === 0) return;

  const notifications = validRecipients.map((recipientId) => ({
    type: "mention",
    course_id: courseId,
    course_name: courseName,
    commenter_id: mentionerId,
    commenter_name: mentionerName,
    comment_preview: commentPreview.length > 50 
      ? commentPreview.slice(0, 50) + "..." 
      : commentPreview,
    recipient_id: recipientId,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to create mention notifications:", error);
};

// ============= Helper: Create student comment notifications for coaches =============
// This should be called when a student comments to notify their responsible coaches
export const createStudentCommentNotifications = async (
  courseId: string,
  courseName: string,
  studentId: string,
  studentName: string,
  commentPreview: string,
  excludeIds: string[] = []
) => {
  // Get coaches responsible for this student
  const coachIds = await getStudentCoachIds(studentId);
  
  // Filter out excluded IDs (e.g., already mentioned users)
  const validRecipients = coachIds.filter((id) => !excludeIds.includes(id) && id !== studentId);
  
  if (validRecipients.length === 0) return;

  const notifications = validRecipients.map((recipientId) => ({
    type: "student_comment",
    course_id: courseId,
    course_name: courseName,
    commenter_id: studentId,
    commenter_name: studentName,
    comment_preview: commentPreview.length > 50 
      ? commentPreview.slice(0, 50) + "..." 
      : commentPreview,
    recipient_id: recipientId,
  }));

  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Failed to create student comment notifications:", error);
};
