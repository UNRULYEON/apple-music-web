import { useHotkey } from "@tanstack/react-hotkeys";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useIsomorphicLayoutEffect, useMediaQuery } from "@/hooks";
import { SIDEBAR_HOTKEY } from "@/lib/hotkeys";
import { clearPreHydrationState, readStoredOpen, writeStoredOpen } from "@/lib/storage/sidebar";

export interface SidebarContextType {
  isOpen: boolean;
  isPeeking: boolean;
  isMobile: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setPeeking: Dispatch<SetStateAction<boolean>>;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(readStoredOpen);
  const [peeking, setPeeking] = useState(false);

  const isMobile = useMediaQuery("max-md");
  const isOpen = open && !isMobile;

  useIsomorphicLayoutEffect(clearPreHydrationState, []);

  useHotkey(SIDEBAR_HOTKEY, () => {
    if (isMobile) {
      setPeeking((wasPeeking) => !wasPeeking);
    } else {
      setOpen((wasOpen) => !wasOpen);
    }
  });

  useEffect(() => {
    writeStoredOpen(open);
  }, [open]);

  const setIsOpen: SidebarContextType["setOpen"] = useCallback(
    (next) => {
      if (isMobile) {
        setPeeking(next);
        return;
      }

      setOpen(next);
      setPeeking(false);
    },
    [isMobile],
  );

  const value = useMemo<SidebarContextType>(
    () => ({
      isOpen,
      isPeeking: peeking && !isOpen,
      isMobile,
      setOpen: setIsOpen,
      setPeeking,
    }),
    [isMobile, isOpen, peeking, setIsOpen],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}
