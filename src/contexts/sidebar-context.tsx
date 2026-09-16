import { useHotkey } from "@tanstack/react-hotkeys";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useMediaQuery } from "@/hooks";
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

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(readStoredOpen);
  const [peeking, setPeeking] = useState(false);

  const isMobile = useMediaQuery("max-md");
  const isOpen = open && !isMobile;

  useIsomorphicLayoutEffect(clearPreHydrationState, []);

  useHotkey(SIDEBAR_HOTKEY, () => {
    if (isMobile) {
      setPeeking((v) => !v);
    } else {
      setOpen((v) => !v);
    }
  });

  useEffect(() => {
    writeStoredOpen(open);
  }, [open]);

  const setIsOpen: SidebarContextType["setOpen"] = useCallback(
    (v) => {
      if (isMobile) {
        setPeeking(v);
        return;
      }

      setOpen(v);
      setPeeking(false);
    },
    [isMobile],
  );

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isPeeking: peeking && !isOpen,
        isMobile,
        setOpen: setIsOpen,
        setPeeking: setPeeking,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
