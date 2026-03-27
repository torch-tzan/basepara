import * as React from "react";
import { cn } from "@/lib/utils";

interface TabNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const TabNav = React.forwardRef<HTMLDivElement, TabNavProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {children}
    </div>
  )
);
TabNav.displayName = "TabNav";

interface TabNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "pill" | "underline";
}

const TabNavItem = React.forwardRef<HTMLButtonElement, TabNavItemProps>(
  ({ className, active, variant = "underline", children, ...props }, ref) => {
    const baseStyles = "px-4 py-2 text-sm transition-colors";
    
    const variantStyles = {
      pill: cn(
        "rounded-md",
        active
          ? "text-foreground font-medium bg-accent"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      ),
      underline: cn(
        "border-b-2",
        active
          ? "text-foreground border-foreground"
          : "text-muted-foreground border-transparent hover:text-foreground"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabNavItem.displayName = "TabNavItem";

export { TabNav, TabNavItem };
