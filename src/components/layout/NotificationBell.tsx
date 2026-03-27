import { Bell, Check, MessageSquare, AtSign, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NotificationType } from "@/hooks/useSupabaseNotifications";

const NotificationBell = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notificationId: string, courseId: string) => {
    markAsRead(notificationId);
    navigate(`/schedule/course/${courseId}`);
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconClass = "w-4 h-4";
    if (type === "mention") {
      return <AtSign className={iconClass} />;
    }
    if (type === "student_comment") {
      return <UserCircle className={iconClass} />;
    }
    return <MessageSquare className={iconClass} />;
  };

  const getNotificationText = (type: NotificationType, commenterName: string, courseName: string) => {
    if (type === "mention") {
      return (
        <>
          <span className="text-sm font-medium truncate">{commenterName}</span>
          <span className="text-xs text-muted-foreground">
            在「{courseName}」提及了你
          </span>
        </>
      );
    }
    if (type === "student_comment") {
      return (
        <>
          <span className="text-sm font-medium truncate">{commenterName}</span>
          <span className="text-xs text-muted-foreground">
            (你負責的學員) 在「{courseName}」留言
          </span>
        </>
      );
    }
    return (
      <>
        <span className="text-sm font-medium truncate">{commenterName}</span>
        <span className="text-xs text-muted-foreground">
          在「{courseName}」留言
        </span>
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 z-[100]">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="font-medium text-sm">通知</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              <Check className="w-3 h-3 mr-1" />
              全部已讀
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            目前沒有通知
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex items-start gap-3 p-3 cursor-pointer",
                  !notification.read && "bg-primary/5",
                  notification.type === "mention" && !notification.read && "bg-accent/30"
                )}
                onClick={() =>
                  handleNotificationClick(notification.id, notification.courseId)
                }
              >
                <div
                  className={cn(
                    "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    notification.read
                      ? "bg-muted text-muted-foreground"
                      : notification.type === "mention"
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary/10 text-primary"
                  )}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    {getNotificationText(
                      notification.type,
                      notification.commenterName,
                      notification.courseName
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.commentPreview}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {notification.createdAt}
                  </span>
                </div>
                {!notification.read && (
                  <div className={cn(
                    "shrink-0 w-2 h-2 rounded-full mt-1.5",
                    notification.type === "mention" ? "bg-accent-foreground" : "bg-primary"
                  )} />
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
