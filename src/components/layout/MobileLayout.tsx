import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Sun, Moon, Menu, Bell, MessageSquare, Home, Calendar, LineChart, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useScrollVisibility } from "@/hooks/use-scroll-visibility";
// Using light logo for brand header on primary background
import logoLight from "@/assets/basepara-logo-light.svg";

const navItems = [
  // { icon: Home, label: "儀表板", path: "/dashboard" }, // Hidden for all roles
  { icon: Calendar, label: "我的課表", path: "/schedule" },
  { icon: LineChart, label: "檢測報告", path: "/reports" },
  { icon: User, label: "個人資料", path: "/students" },
];

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  noPadding?: boolean;
}

const MobileLayout = ({ children, title, noPadding = false }: MobileLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { theme, setTheme } = useTheme();
  const { isVisible } = useScrollVisibility({ threshold: 8 });
  const [teamName, setTeamName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch student's team name
  useEffect(() => {
    const fetchTeamName = async () => {
      if (!authUser?.email) return;

      // First get student's team_id by email
      const { data: student } = await supabase
        .from("students")
        .select("team_id")
        .eq("email", authUser.email)
        .maybeSingle();

      if (student?.team_id) {
        // Then get team name
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", student.team_id)
          .maybeSingle();

        if (team?.name) {
          setTeamName(team.name);
        }
      }
    };

    fetchTeamName();
  }, [authUser?.email]);

  const handleLogout = () => {
    logout(navigate);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };


  const handleNotificationClick = (notificationId: string, courseId: string) => {
    markAsRead(notificationId);
    navigate(`/schedule/course/${courseId}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar - Logo & User Info with brand color */}
      <div 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-primary px-4 h-14 flex items-center justify-between shadow-md",
          "transition-transform duration-300 ease-out",
          !isVisible && "-translate-y-full"
        )}
      >
        {/* Left: Hamburger Menu & Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Left Side */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-card">
              {/* User Profile Section */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-base font-semibold text-primary-foreground">
                      {authUser?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{authUser?.name || "用戶"}</p>
                    <p className="text-xs text-muted-foreground">{teamName || "學員"}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                {/* Navigation Items */}
                <nav className="flex flex-col p-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || 
                      (item.path !== "/dashboard" && location.pathname.startsWith(item.path + "/"));
                    
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                          isActive 
                            ? "bg-primary text-primary-foreground font-medium" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10"
                        )}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="border-t border-border my-2 mx-2" />
                
                {/* Settings */}
                <div className="flex flex-col p-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="w-[18px] h-[18px]" />
                        <span className="text-sm">切換淺色模式</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-[18px] h-[18px]" />
                        <span className="text-sm">切換深色模式</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-muted dark:hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-[18px] h-[18px]" />
                    <span className="text-sm">登出</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo - Clickable to Schedule */}
          <Link to="/schedule">
            <img src={logoLight} alt="Basepara" className="h-7" />
          </Link>
        </div>
        
        {/* Notification Bell - Right Side */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 relative text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 z-[100]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="font-medium text-sm">通知</span>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.preventDefault();
                      markAllAsRead();
                    }}
                  >
                    全部已讀
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  目前沒有通知
                </div>
              ) : (
                <ScrollArea className="max-h-[250px]">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-2 p-3 cursor-pointer",
                        !notification.read && "bg-primary/5"
                      )}
                      onClick={() =>
                        handleNotificationClick(notification.id, notification.courseId)
                      }
                    >
                      <div
                        className={cn(
                          "shrink-0 w-7 h-7 rounded-full flex items-center justify-center",
                          notification.read
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-xs">
                          <span className="font-medium">{notification.commenterName}</span>
                          <span className="text-muted-foreground"> 在「{notification.courseName}」留言</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {notification.commentPreview}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page Title Header */}
      <header 
        className={cn(
          "fixed left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border px-4 h-11 flex items-center shadow-sm",
          "transition-all duration-300 ease-out",
          isVisible ? "top-14" : "top-0"
        )}
      >
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </header>

      {/* Spacer for fixed headers */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? "h-[100px]" : "h-11"
      )} />
      
      {/* Main Content */}
      <main 
        key={location.pathname}
        className={cn("flex-1", noPadding ? "p-0 pb-4" : "p-4")}
      >
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;
