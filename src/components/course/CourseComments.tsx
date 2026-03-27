import { useState, useMemo } from "react";
import { MessageSquare, Send, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  useCourseComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from "@/hooks/useSupabaseComments";
import {
  createCommentNotifications,
  createMentionNotifications,
  createStudentCommentNotifications,
} from "@/hooks/useSupabaseNotifications";
import { useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useSupabaseAccounts";
import { useStudents } from "@/hooks/useSupabaseStudents";
import MentionInput, {
  parseMentions,
  renderMentionText,
  type MentionUser,
} from "./MentionInput";

interface CourseCommentsProps {
  courseId: string;
  courseName?: string;
}

const CourseComments = ({ courseId, courseName = "課程" }: CourseCommentsProps) => {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useCourseComments(courseId);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  // Fetch accounts and students for mention suggestions
  const { data: accounts = [] } = useAccounts();
  const { data: students = [] } = useStudents();

  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const currentUserId = authUser?.id || "guest";
  const currentUserName = authUser?.name || "訪客";
  const currentUserRole = authUser?.role === "student" ? "student" : "coach";

  // Build mention users list from accounts and students
  const mentionUsers: MentionUser[] = useMemo(() => {
    const users: MentionUser[] = [];

    // Add coaches/admins from accounts
    accounts.forEach((account) => {
      if (account.id !== currentUserId) {
        users.push({
          id: account.id,
          name: account.name,
          type: "coach",
        });
      }
    });

    // Add students
    students.forEach((student) => {
      if (student.id !== currentUserId) {
        users.push({
          id: student.id,
          name: student.name,
          type: "student",
        });
      }
    });

    return users;
  }, [accounts, students, currentUserId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !authUser) return;

    try {
      await addCommentMutation.mutateAsync({
        course_id: courseId,
        user_id: currentUserId,
        user_name: currentUserName,
        user_role: currentUserRole,
        content: newComment.trim(),
      });

      // Parse mentions from the comment
      const { mentionedIds } = parseMentions(newComment.trim(), mentionUsers);

      // Create mention notifications for @mentioned users
      if (mentionedIds.length > 0) {
        await createMentionNotifications(
          courseId,
          courseName,
          currentUserId,
          currentUserName,
          newComment.trim(),
          mentionedIds
        );
      }

      // If the commenter is a student, notify their responsible coaches
      if (currentUserRole === "student") {
        await createStudentCommentNotifications(
          courseId,
          courseName,
          currentUserId,
          currentUserName,
          newComment.trim(),
          mentionedIds // Exclude already mentioned users
        );
      }

      // Create regular comment notifications for other participants (excluding mentioned)
      const participantIds = [...new Set(comments.map((c) => c.userId))].filter(
        (id) => !mentionedIds.includes(id)
      );
      if (participantIds.length > 0) {
        await createCommentNotifications(
          courseId,
          courseName,
          currentUserId,
          currentUserName,
          newComment.trim(),
          participantIds
        );
      }

      // Invalidate notifications cache
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      setNewComment("");
    } catch (error) {
      toast({
        title: "發送失敗",
        description: "無法發送留言，請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateCommentMutation.mutateAsync({
        id: commentId,
        content: editContent.trim(),
        course_id: courseId,
      });
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      toast({
        title: "儲存失敗",
        description: "無法更新留言，請稍後再試",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMutation.mutateAsync({
        id: commentId,
        course_id: courseId,
      });
    } catch (error) {
      toast({
        title: "刪除失敗",
        description: "無法刪除留言，請稍後再試",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-medium text-foreground flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        留言討論
        <span className="text-muted-foreground font-normal">
          {comments.length} 則留言
        </span>
      </h2>

      {/* New Comment Input - with mention support */}
      <div className="flex gap-3">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback
            className={
              currentUserRole === "coach"
                ? "bg-primary text-primary-foreground text-xs"
                : "bg-secondary text-secondary-foreground text-xs"
            }
          >
            {getInitials(currentUserName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2 items-start">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            users={mentionUsers}
            placeholder="輸入留言..."
            disabled={addCommentMutation.isPending}
          />
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="shrink-0"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1.5" />
            )}
            發送
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
            載入中...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            尚無留言，成為第一個發言的人吧！
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userId === currentUserId;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-lg bg-muted/30"
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback
                    className={
                      comment.userRole === "coach"
                        ? "bg-primary text-primary-foreground text-xs"
                        : "bg-secondary text-secondary-foreground text-xs"
                    }
                  >
                    {getInitials(comment.userName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {comment.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {comment.userRole === "coach" ? "教練" : "學員"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {comment.updatedAt
                        ? `已編輯 ${comment.updatedAt}`
                        : comment.createdAt}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[60px] text-sm"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-3.5 h-3.5 mr-1" />
                          取消
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={updateCommentMutation.isPending}
                        >
                          {updateCommentMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 mr-1" />
                          )}
                          儲存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {renderMentionText(comment.content)}
                      </p>

                      {isOwner && (
                        <div className="flex items-center gap-1 pt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleEditComment(comment.id, comment.content)}
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            編輯
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            刪除
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CourseComments;
