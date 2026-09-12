import { useCloseSidebarOnMobile, useSidebar, useView } from "@/hooks";
import { TRANSITION_SLOW } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/views/view";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "@/components";
import { CommandMenuTrigger } from "@/components/command-menu";
import { Button } from "@/components/ui/button";
import { DiscAlbumIcon, Mic01Icon, MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

const SIDEBAR_WIDTH = 256;
const SWIPE_CLOSE_DISTANCE = SIDEBAR_WIDTH * 0.1;
const SWIPE_CLOSE_VELOCITY = 500;

export function Nav() {
  const { isOpen, isPeeking, isMobile, setOpen, setPeeking } = useSidebar();
  const { view, open } = useView();
  const closeSidebarOnMobile = useCloseSidebarOnMobile();
  const isRecentlyPlayed =
    view.name === "home" || (view.name === "list" && view.list === "recently-played");
  const isAlbums = view.name === "list" && view.list === "albums";
  const isArtists = view.name === "list" && view.list === "artists";

  function openAndClose(next: View) {
    open(next);
    closeSidebarOnMobile();
  }

  return (
    <div className="flex flex-col">
      <AnimatePresence>
        {isPeeking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_SLOW}
            className="fixed inset-0 z-20 bg-black/32 backdrop-blur-sm"
            data-slot="nav-backdrop"
            onClick={() => {
              setPeeking(false);
            }}
          />
        )}
      </AnimatePresence>
      <motion.div
        className="relative flex flex-col grow"
        data-slot="nav-panel"
        suppressHydrationWarning
        initial={false}
        animate={{
          width: isOpen ? SIDEBAR_WIDTH : 0,
        }}
        transition={TRANSITION_SLOW}
        onHoverStart={isMobile ? undefined : () => setPeeking(true)}
        onHoverEnd={isMobile ? undefined : () => setPeeking(false)}
      >
        <motion.div
          className="absolute bottom-2 flex flex-col p-2 pb-0 pr-0 z-50"
          data-slot="nav-panel-inner"
          suppressHydrationWarning
          style={{ touchAction: "none" }}
          initial={false}
          animate={{
            top: isOpen || isMobile ? 0 : 40,
            width: SIDEBAR_WIDTH,
            x: isOpen || isPeeking ? 0 : -SIDEBAR_WIDTH,
          }}
          transition={TRANSITION_SLOW}
          drag={isMobile ? "x" : false}
          dragConstraints={{
            left: -SIDEBAR_WIDTH,
            right: 0,
          }}
          dragTransition={{
            bounceStiffness: 300,
            bounceDamping: 30,
          }}
          dragElastic={0.1}
          whileDrag={{
            scale: 1.005,
          }}
          onDragEnd={(_event, info) => {
            if (!isMobile) return;

            if (info.offset.x < -SWIPE_CLOSE_DISTANCE || info.velocity.x < -SWIPE_CLOSE_VELOCITY) {
              setPeeking(false);
              setOpen(false);
            }
          }}
        >
          <nav
            className={cn(
              `h-full p-2`,
              "flex flex-col",
              "text-sidebar-foreground",
              "bg-sidebar/75",
              "backdrop-blur-2xl",
              "border border-sidebar-border",
              "rounded-lg",
            )}
          >
            <div className="flex flex-col grow gap-1">
              <CommandMenuTrigger />
              <NavItem
                icon={MusicNote02Icon}
                label="Recently played"
                isCurrent={isRecentlyPlayed}
                onClick={() => openAndClose({ name: "list", list: "recently-played" })}
              />
              <NavItem
                icon={DiscAlbumIcon}
                label="Albums"
                isCurrent={isAlbums}
                onClick={() => openAndClose({ name: "list", list: "albums" })}
              />
              <NavItem
                icon={Mic01Icon}
                label="Artists"
                isCurrent={isArtists}
                onClick={() => openAndClose({ name: "list", list: "artists" })}
              />
            </div>
            <div className="flex flex-col">
              <BottomNav />
            </div>
          </nav>
        </motion.div>
      </motion.div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  isCurrent,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "justify-start",
        isCurrent && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
      )}
      aria-current={isCurrent ? "page" : undefined}
      onClick={onClick}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
      {label}
    </Button>
  );
}
