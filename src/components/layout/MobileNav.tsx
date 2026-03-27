import { Link, useLocation } from "react-router-dom";
import { Home, User, Calendar, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  // { icon: Home, label: "儀表板", path: "/dashboard" }, // Hidden for all roles
  { icon: Calendar, label: "課表", path: "/schedule" },
  { icon: LineChart, label: "報告", path: "/reports" },
  { icon: User, label: "我的", path: "/students" },
];

interface MobileNavProps {
  isVisible?: boolean;
}

const MobileNav = ({ isVisible = true }: MobileNavProps) => {
  const location = useLocation();

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-card via-card to-card/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom",
        "transition-transform duration-300 ease-out",
        !isVisible && "translate-y-full"
      )}
    >
      {/* Subtle glow effect at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="flex items-center justify-around h-[68px] px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== "/dashboard" && location.pathname.startsWith(item.path + "/"));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-all duration-300 ease-out",
                "active:scale-95"
              )}
            >
              {/* Icon container */}
              <div className="relative z-10 flex items-center justify-center w-11 h-7">
                <Icon 
                  className={cn(
                    "w-[22px] h-[22px] transition-all duration-300",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )} 
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
              </div>
              
              {/* Label with smooth appearance */}
              <span className={cn(
                "relative z-10 text-[11px] font-medium transition-all duration-300 mt-0.5",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
