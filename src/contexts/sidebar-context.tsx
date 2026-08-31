import { useMediaQuery } from "@/hooks";
import { clearPreHydrationState, readStoredOpen, writeStoredOpen } from "@/lib/sidebar-storage";
import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";

export type SidebarContextType = {
  isOpen: boolean;
  isPeeking: boolean;
  isMobile: boolean;
  setOpen: Dispatch<React.SetStateAction<boolean>>;
  setPeeking: Dispatch<React.SetStateAction<boolean>>;
};

export const SidebarContext = createContext<SidebarContextType | undefined>({
  isOpen: false,
  isPeeking: false,
  isMobile: false,
  setOpen: () => {},
  setPeeking: () => {},
});

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(readStoredOpen);
  const [peeking, setPeeking] = useState(false);

  const isMobile = useMediaQuery("max-md");
  const isOpen = open && !isMobile;

  // Motion writes its styles in a child layout effect, so the pre-hydration
  // override is only safe to drop here, in the parent.
  useIsomorphicLayoutEffect(clearPreHydrationState, []);

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
