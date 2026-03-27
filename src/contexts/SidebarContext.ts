import { createContext, useContext } from "react";

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);
