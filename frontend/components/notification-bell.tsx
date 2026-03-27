"use client";

import { useEffect, useCallback } from "react";
import { Bell, CheckCheck, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  Notification,
} from "@/store/notifications";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import axiosInstance from "@/utils/axios";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { toast } = useToast();
  const { list, unreadCount, total } = useAppSelector(
    (s) => s.notificationsReducer
  );

  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => {
      dispatch(fetchUnreadCount());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleOpen = useCallback(
    (open: boolean) => {
      if (open) {
        dispatch(fetchNotifications({ limit: 20 }));
      }
    },
    [dispatch]
  );

  const handleClick = async (notif: Notification) => {
    if (!notif.is_read) {
      dispatch(markNotificationRead(notif.id));
    }
    // Don't navigate for removal notifications — user no longer has access
    if (notif.type === "COURSE_REMOVED") return;

    // Verify resource is accessible before navigating to avoid 404 errors
    try {
      if (notif.test_id) {
        await axiosInstance.get(`/tests/${notif.test_id}`);
        router.push(`/dashboard/tests/${notif.test_id}`);
      } else if (notif.course_id) {
        await axiosInstance.get(`/courses/${notif.course_id}`);
        router.push(`/dashboard/courses/${notif.course_id}`);
      }
    } catch {
      toast({
        title: "Not accessible",
        description: "This resource is no longer available to you.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (e: React.MouseEvent, notifId: number) => {
    e.stopPropagation();
    dispatch(deleteNotification(notifId));
  };

  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-indigo-600 h-auto py-1 px-2"
                onClick={() => dispatch(markAllNotificationsRead())}
              >
                <CheckCheck className="h-3 w-3 mr-1" /> Mark all read
              </Button>
            )}
            {list.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 h-auto py-1 px-2"
                onClick={handleClearAll}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear all
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {list.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            list.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={cn(
                  "p-3 border-b hover:bg-slate-50 transition-colors",
                  !notif.is_read && "bg-indigo-50/50",
                  notif.type === "COURSE_REMOVED" ? "cursor-default" : "cursor-pointer"
                )}
              >
                <div className="flex items-start gap-2">
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", notif.is_read && "ml-4")}>
                    <p className="text-sm font-medium truncate">
                      {notif.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getTimeAgo(notif.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="shrink-0 p-1 rounded hover:bg-slate-200 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
