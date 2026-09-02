import { Button } from "@/components/ui/button";
import { useIsHydrated, useSidebar } from "@/hooks";
import { cn } from "@/lib/utils";
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";

export function SidebarToggle() {
  const { isOpen, isPeeking, isMobile, setOpen, setPeeking } = useSidebar();
  const isHydrated = useIsHydrated();

  const showsOpen = isHydrated ? isOpen : true;
  const showsMobile = isHydrated && isMobile;

  return (
    <div>
      {!showsOpen && (
        <motion.div
          className={cn(
            "absolute top-0 left-0",
            "h-12",
            "hover:cursor-pointer",
            isPeeking ? "w-48" : "w-12",
            showsMobile ? "z-0" : "z-50",
          )}
          onClick={() => setOpen((v) => !v)}
          onHoverStart={() => setPeeking(true)}
          onHoverEnd={() => setPeeking(false)}
        />
      )}
      <Button
        variant="ghost"
        className={cn(
          "relative data-hover:bg-neutral-300 data-hover:dark:bg-neutral-800 transition-colors",
          showsMobile ? "z-0" : "z-40",
        )}
        onClick={() => setOpen((v) => !v)}
        aria-label={`${showsOpen ? "Close" : "Open"} sidebar`}
        size="icon"
        data-hover={isPeeking || undefined}
      >
        <HugeiconsIcon
          icon={showsOpen ? PanelLeftOpenIcon : PanelLeftCloseIcon}
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
