import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useSidebar } from "@/hooks";
import { PLAYER_HOTKEYS, SHORTCUTS_HOTKEY, SIDEBAR_HOTKEY } from "@/lib/hotkeys";
import { KeyboardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { formatForDisplay, useHotkey, type Hotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";

interface Shortcut {
  hotkey: Hotkey;
  label: string;
}

const GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: "General",
    shortcuts: [
      { hotkey: SIDEBAR_HOTKEY, label: "Open or close the sidebar" },
      { hotkey: SHORTCUTS_HOTKEY, label: "Show the shortcuts" },
    ],
  },
  {
    title: "Player",
    shortcuts: [
      { hotkey: PLAYER_HOTKEYS.toggle, label: "Play or pause" },
      { hotkey: PLAYER_HOTKEYS.next, label: "Next song" },
      { hotkey: PLAYER_HOTKEYS.previous, label: "Previous song" },
      { hotkey: PLAYER_HOTKEYS.shuffle, label: "Shuffle" },
      { hotkey: PLAYER_HOTKEYS.repeat, label: "Repeat" },
      { hotkey: PLAYER_HOTKEYS.louder, label: "Volume up" },
      { hotkey: PLAYER_HOTKEYS.quieter, label: "Volume down" },
    ],
  },
];

function keyLabel(key: string): string {
  return key === "Space" ? "Space" : formatForDisplay(key);
}

function Keys({ hotkey }: { hotkey: Hotkey }) {
  return (
    <KbdGroup>
      <span className="sr-only">{hotkey}</span>
      {hotkey.split("+").map((key) => (
        <Kbd key={key} aria-hidden="true">
          {keyLabel(key)}
        </Kbd>
      ))}
    </KbdGroup>
  );
}

export function ShortcutsDialog() {
  const { isMobile, setOpen } = useSidebar();
  const [isShown, setShown] = useState(false);

  function closeSidebarOnMobile() {
    if (isMobile) {
      setOpen(false);
    }
  }

  useHotkey(SHORTCUTS_HOTKEY, () => {
    closeSidebarOnMobile();
    setShown(true);
  });

  return (
    <Dialog open={isShown} onOpenChange={setShown}>
      <DialogTrigger
        render={<Button variant="ghost" className="justify-start" />}
        aria-keyshortcuts={SHORTCUTS_HOTKEY}
        onClick={closeSidebarOnMobile}
      >
        <HugeiconsIcon icon={KeyboardIcon} strokeWidth={2} aria-hidden="true" />
        Shortcuts
      </DialogTrigger>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>The player keys work while a song is in the player.</DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-6">
          {GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-2">
              <h3 className="text-xs font-medium text-muted-foreground">{group.title}</h3>
              <dl className="flex flex-col gap-2">
                {group.shortcuts.map(({ hotkey, label }) => (
                  <div key={hotkey} className="flex items-center justify-between gap-4 text-sm">
                    <dt>{label}</dt>
                    <dd>
                      <Keys hotkey={hotkey} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}
