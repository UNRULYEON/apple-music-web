import { SidebarContext } from "@/contexts";
import { useContext } from "react";

export function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
}

export function useCloseSidebarOnMobile(): () => void {
  const { isMobile, setOpen } = useSidebar();

  return function closeSidebarOnMobile() {
    if (isMobile) {
      setOpen(false);
    }
  };
}
