// Notifications context for course comment notifications - Supabase integrated
import { createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useNotifications as useSupabaseNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
  type NotificationType,
} from "@/hooks/useSupabaseNotifications";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export type { Notification, NotificationType } from "@/hooks/useSupabaseNotifications";

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const userId = authUser?.id;

  const { data: notifications = [], isLoading } = useSupabaseNotifications(userId);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          // Refetch notifications when a new one is added
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!userId) return;
      markReadMutation.mutate({ id: notificationId, recipient_id: userId });
    },
    [markReadMutation, userId]
  );

  const markAllAsRead = useCallback(() => {
    if (!userId) return;
    markAllReadMutation.mutate(userId);
  }, [markAllReadMutation, userId]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
