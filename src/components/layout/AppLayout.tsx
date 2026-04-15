import { ReactNode, useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileLayout from "./MobileLayout";
import NotificationBell from "./NotificationBell";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  headerAction?: ReactNode;
  noPadding?: boolean;
}

const AppLayout = ({ children, title, headerAction, noPadding }: AppLayoutProps) => {
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const { toast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [hasShownMobileWarning, setHasShownMobileWarning] = useState(false);

  const isStudent = authUser?.role === "student";

  // Auto-collapse sidebar when clicking outside on tablet
  const handleContentClick = useCallback(() => {
    if (isTablet && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isTablet, sidebarCollapsed, setSidebarCollapsed]);

  // Default to collapsed on tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    }
  }, [isTablet, setSidebarCollapsed]);

  // Auto-collapse sidebar on route change for tablet
  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isTablet, setSidebarCollapsed]);

  // Check if non-student user is on mobile - redirect to login
  useEffect(() => {
    if (isMobile && authUser && authUser.role !== "student" && !hasShownMobileWarning) {
      setHasShownMobileWarning(true);
      toast({
        title: "請於電腦版操作",
        description: "目前僅支援學員於行動裝置使用",
        variant: "destructive",
      });
      logout(navigate);
    }
  }, [isMobile, authUser, hasShownMobileWarning, toast, logout, navigate]);

  useEffect(() => {
    // Trigger animation on route change
    setIsAnimating(true);
    
    // Small delay to allow exit animation before showing new content
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  // Mobile layout for students
  if (isMobile && isStudent) {
    return (
      <MobileLayout title={title} noPadding={noPadding}>
        {displayChildren}
      </MobileLayout>
    );
  }

  // Desktop layout (original)
  return (
    <div className="flex h-screen bg-background overflow-hidden print:block print:h-auto print:overflow-visible">
      {/* Overlay backdrop for tablet when sidebar is open */}
      {isTablet && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={handleContentClick}
        />
      )}
      
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div 
        className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
          isTablet ? 'ml-16' : ''
        }`}
        onClick={handleContentClick}
      >
        {/* Header */}
        <header className="bg-card border-b border-border px-6 h-[72px] shrink-0 flex items-center print:hidden">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {headerAction}
            </div>
          </div>
        </header>
        
        {/* Main Content with page transition */}
        <main
          key={location.pathname}
          className="flex-1 p-6 overflow-auto page-transition print:p-0 print:overflow-visible print-reset-layout"
        >
          {displayChildren}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
