import { formatForDisplay, type Hotkey } from "@tanstack/react-hotkeys";
import type { ComponentProps } from "react";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { resolveHotkey } from "@/lib/hotkeys";

export function HotkeyKeys({ hotkey, ...props }: { hotkey: Hotkey } & ComponentProps<"kbd">) {
  const resolved = resolveHotkey(hotkey);

  return (
    <KbdGroup {...props}>
      <span className="sr-only">{resolved}</span>
      {resolved.split("+").map((key) => (
        <Kbd key={key} aria-hidden="true">
          {keyLabel(key)}
        </Kbd>
      ))}
    </KbdGroup>
  );
}

function keyLabel(key: string): string {
  return key === "Space" ? "Space" : formatForDisplay(key);
}
