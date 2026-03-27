import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "h-9 w-9 relative overflow-hidden",
            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            theme === "dark" && "bg-accent/50 border-primary/30 dark:bg-white/10 dark:border-white/20",
            theme === "light" && "bg-accent/50 border-primary/30"
          )}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切換主題</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="animate-in fade-in-0 zoom-in-95">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50 dark:hover:bg-white/10",
            theme === "light" && "bg-accent dark:bg-white/10"
          )}
        >
          <Sun className="mr-2 h-4 w-4" />
          淺色模式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50 dark:hover:bg-white/10",
            theme === "dark" && "bg-accent dark:bg-white/10"
          )}
        >
          <Moon className="mr-2 h-4 w-4" />
          深色模式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={cn(
            "cursor-pointer transition-colors hover:bg-accent/50 dark:hover:bg-white/10",
            theme === "system" && "bg-accent dark:bg-white/10"
          )}
        >
          <Monitor className="mr-2 h-4 w-4" />
          系統設定
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
