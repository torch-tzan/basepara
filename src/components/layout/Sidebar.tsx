import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  UserRound,
  Shield,
  Calendar,
  LineChart,
  Upload,
  Layers,
  UserCog,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  GripVertical,
  Sun,
  Moon,
  Lock,
  FolderHeart,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import baseparaLogoLightMode from "@/assets/basepara-logo-light-mode.svg";
import baseparaLogoDark from "@/assets/basepara-logo-dark.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { useAccounts } from "@/contexts/AccountsContext";
import { PermissionModuleId } from "@/data/accountsData";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";

// Sidebar width constraints
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 256; // w-64 = 16rem = 256px
const COLLAPSED_WIDTH = 64; // w-16 = 4rem = 64px

// Map permission module IDs to routes
const allNavItems: {
  icon: typeof Home;
  label: string;
  studentLabel: string;
  path: string;
  permissionId: PermissionModuleId | null; // null for items without permission check
}[] = [
  // { icon: Home, label: "儀表板", studentLabel: "儀表板", path: "/dashboard", permissionId: "home" }, // Hidden for all roles
  { icon: Calendar, label: "課表管理", studentLabel: "課表管理", path: "/schedule", permissionId: "schedule" },
  { icon: Activity, label: "訓練紀錄", studentLabel: "訓練紀錄", path: "/training-records", permissionId: null }, // Visible based on role, students see their own
  { icon: LineChart, label: "檢測報告", studentLabel: "檢測報告", path: "/reports", permissionId: "reports" },
  { icon: Upload, label: "資料上傳", studentLabel: "資料上傳", path: "/upload", permissionId: "upload" },
  { icon: Shield, label: "球隊管理", studentLabel: "球隊管理", path: "/teams", permissionId: "teams" },
  { icon: UserRound, label: "學員資料管理", studentLabel: "個人資料", path: "/students", permissionId: "students" },
  { icon: Layers, label: "層級比較", studentLabel: "層級比較", path: "/comparison", permissionId: "comparison" },
  { icon: FileText, label: "公用範本", studentLabel: "公用範本", path: "/templates", permissionId: "templates" },
  { icon: FolderHeart, label: "個人範本", studentLabel: "個人範本", path: "/personal-templates", permissionId: null }, // No permission check, visibility controlled by role
  { icon: UserCog, label: "帳號管理", studentLabel: "帳號管理", path: "/accounts", permissionId: "accounts" },
];

// Role name mapping
const getRoleName = (role: UserRole | null | undefined): string => {
  const roleNames: Record<UserRole, string> = {
    admin: "管理員",
    venue_coach: "場館教練",
    team_coach: "球隊教練",
    student: "學員",
  };
  return role ? roleNames[role] : "";
};


interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();
  const { accounts, getRoleById } = useAccounts();
  const { resolvedTheme, setTheme } = useTheme();
  
  // Logo assets are already imported at the top
  
  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Get the role permissions and display name for the current user
  const { navItems, displayRoleName } = useMemo(() => {
    if (!authUser) return { navItems: [], displayRoleName: "" };
    
    const isStudent = authUser.role === "student";
    
    // Students have fixed nav items and role name
    // Include items with specific permissionIds OR training-records (permissionId: null but path matches)
    if (isStudent) {
      const studentModules: PermissionModuleId[] = ["home", "schedule", "reports", "students"];
      const studentPaths = ["/training-records"]; // Additional paths for students with null permissionId
      const items = allNavItems.filter((item) => 
        (item.permissionId !== null && studentModules.includes(item.permissionId)) ||
        studentPaths.includes(item.path)
      );
      return { navItems: items, displayRoleName: "學員" };
    }
    
    // Find the user's account to get their actual role_id from the database
    const userAccount = accounts.find((a) => a.email.toLowerCase() === authUser.email.toLowerCase());
    const roleId = userAccount?.roleId || null;
    const role = roleId ? getRoleById(roleId) : null;
    
    // Get the actual role name from database
    const roleName = role?.name || getRoleName(authUser?.role);
    
    if (!role) {
      // Fallback for admin enum without account record - show all items
      if (authUser.role === "admin") {
        return { navItems: allNavItems, displayRoleName: roleName };
      }
      // Otherwise, show nothing
      return { navItems: [], displayRoleName: roleName };
    }

    // Filter nav items based on view permission from the actual role in database
    // Items with null permissionId are always visible (but still excluded for students above)
    const items = allNavItems.filter((item) => {
      if (item.permissionId === null) return true; // Always visible for non-students
      const permission = role.permissions[item.permissionId];
      return permission?.view === true;
    });
    
    return { navItems: items, displayRoleName: roleName };
  }, [authUser, accounts, getRoleById]);

  return (
    <TooltipProvider delayDuration={0}>
      <div
        ref={sidebarRef}
        style={{ width: collapsed ? COLLAPSED_WIDTH : sidebarWidth }}
        className={`
          bg-card border-r border-border flex flex-col h-screen transition-[width] duration-300 shrink-0
          /* Desktop: normal flow */
          lg:relative lg:z-50 lg:sticky lg:top-0
          /* Tablet (md): overlay behavior */
          md:max-lg:fixed md:max-lg:z-50 md:max-lg:top-0 md:max-lg:left-0 md:max-lg:shadow-xl
        `}
      >
        {/* Logo - Clickable to Schedule */}
        <Link 
          to="/schedule"
          className={`h-[72px] border-b border-border flex items-center relative overflow-hidden transition-all duration-300 ${
            collapsed ? 'px-2 justify-center' : 'px-3 gap-3'
          }`}
        >
          <div className={`relative shrink-0 transition-all duration-300 ${
            collapsed ? 'h-[40px]' : 'h-[50px]'
          }`}>
            {/* Light mode logo */}
            <img 
              src={baseparaLogoLightMode} 
              alt="Basepara 貝思沛拉棒球學校" 
              className={`w-auto object-contain absolute top-0 left-0 transition-all duration-300 ${
                collapsed ? 'h-[40px]' : 'h-[50px]'
              } ${
                resolvedTheme === 'dark' ? 'opacity-0' : 'opacity-100'
              }`}
            />
            {/* Dark mode logo */}
            <img 
              src={baseparaLogoDark} 
              alt="Basepara 貝思沛拉棒球學校" 
              className={`w-auto object-contain transition-all duration-300 ${
                collapsed ? 'h-[40px]' : 'h-[50px]'
              } ${
                resolvedTheme === 'dark' ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              棒球訓練平台
            </span>
          )}
        </Link>
        
        {/* Collapse Toggle Button - aligned with "儀表板" button center */}
        {/* Logo: 72px + nav pt-4: 16px + half of button height (~20px) = ~108px, minus button radius */}
        <button
          onClick={onToggle}
          className="absolute z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm hover:bg-accent dark:hover:bg-white/10 hover:shadow-md transition-all duration-200 top-[96px] -right-3"
          aria-label={collapsed ? "展開選單" : "收合選單"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        {/* Resize Handle */}
        {!collapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group ${
              isResizing ? 'bg-primary' : ''
            }`}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 pt-4">

          <ul className="space-y-1">
            {navItems.map((item) => {
              // Check if current path starts with the nav item path (for detail pages)
              const isActive = location.pathname === item.path || 
                (item.path !== "/dashboard" && location.pathname.startsWith(item.path + "/"));
              const Icon = item.icon;
              const displayLabel = authUser?.role === "student" ? item.studentLabel : item.label;
              const linkContent = (
                <Link
                  to={item.path}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && (
                    <span className="text-sm relative">
                      {displayLabel}
                      {/* Hover underline animation - only show when not active and not collapsed */}
                      {!isActive && (
                        <span className="absolute left-0 -bottom-0.5 h-[2px] w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full" />
                      )}
                    </span>
                  )}
                </Link>
              );

              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="z-[100]">
                        <p>{displayLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-2 border-t border-border">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  {collapsed ? (
                    <button className="flex items-center justify-center p-2 text-muted-foreground w-full hover:bg-accent/50 dark:hover:bg-white/10 rounded-md transition-colors">
                      <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                        {authUser?.name.charAt(0) || "?"}
                      </div>
                    </button>
                  ) : (
                    <button className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground w-full hover:bg-accent/50 dark:hover:bg-white/10 rounded-md transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium shrink-0">
                        {authUser?.name.charAt(0) || "?"}
                      </div>
                      <div className="text-sm text-left flex-1">
                        <div className="text-foreground font-medium">{authUser?.name || ""}</div>
                        <div className="text-muted-foreground">{displayRoleName}</div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  )}
                </DropdownMenuTrigger>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="z-[100]">
                  <p>{authUser?.name || ""} ({displayRoleName})</p>
                </TooltipContent>
              )}
            </Tooltip>
            <DropdownMenuContent side="top" align="start" className="w-56 z-[100]">
              <DropdownMenuItem 
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} 
                className="gap-2 hover:bg-accent/50 dark:hover:bg-white/10"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                {resolvedTheme === 'dark' ? '淺色模式' : '深色模式'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/change-password')} 
                className="gap-2 hover:bg-accent/50 dark:hover:bg-white/10"
              >
                <Lock className="w-4 h-4" />
                變更密碼
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout(navigate)} className="gap-2 text-destructive hover:bg-accent/50 dark:hover:bg-white/10">
                <LogOut className="w-4 h-4" />
                登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
