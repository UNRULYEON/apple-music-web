import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsHydrated, useSidebar } from "@/hooks";
import { TRANSITION_REVEAL } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function SidebarToggle() {
  const { isOpen, isPeeking, isMobile, setOpen, setPeeking } = useSidebar();
  const isHydrated = useIsHydrated();

  const showsOpen = isHydrated ? isOpen : true;
  const showsMobile = isHydrated && isMobile;
  const [canPeek, setCanPeek] = useState(false);

  useEffect(() => {
    if (showsOpen || showsMobile) {
      setCanPeek(false);
      return;
    }

    const timer = setTimeout(() => setCanPeek(true), TRANSITION_REVEAL.duration * 1000);

    return () => clearTimeout(timer);
  }, [showsOpen, showsMobile]);

  return (
    <div>
      {canPeek && (
        <motion.div
          data-slot="sidebar-peek"
          className={cn(
            "absolute top-0 left-0",
            "h-12",
            "hover:cursor-pointer",
            isPeeking ? "w-48" : "w-12",
            "z-50",
          )}
          onClick={() => setOpen((wasOpen) => !wasOpen)}
          onHoverStart={() => setPeeking(true)}
          onHoverEnd={() => setPeeking(false)}
        />
      )}
      <Button
        variant="ghost"
        className={cn(
          "relative transition-[background-color] duration-(--duration-quick) ease-(--ease-smooth-out) data-hover:bg-neutral-300 motion-reduce:transition-none dark:data-hover:bg-neutral-800",
          showsMobile ? "z-0" : "z-40",
        )}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-label={`${showsOpen ? "Close" : "Open"} sidebar`}
        size="icon"
        data-hover={isPeeking || undefined}
      >
        <HugeiconsIcon
          icon={showsOpen ? PanelLeftOpenIcon : PanelLeftCloseIcon}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
