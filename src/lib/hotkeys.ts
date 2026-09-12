import { formatHotkey, parseHotkey, type Hotkey } from "@tanstack/react-hotkeys";

export const SIDEBAR_HOTKEY = "[" satisfies Hotkey;

export const SHORTCUTS_HOTKEY = "Shift+?" as Hotkey;

export const COMMAND_MENU_HOTKEY = "Mod+K" satisfies Hotkey;

export const PLAYER_HOTKEYS = {
  toggle: "Space",
  next: "Shift+ArrowRight",
  previous: "Shift+ArrowLeft",
  shuffle: "S",
  repeat: "R",
  louder: "Shift+ArrowUp",
  quieter: "Shift+ArrowDown",
} as const satisfies Record<string, Hotkey>;

export function resolveHotkey(hotkey: Hotkey): string {
  return formatHotkey(parseHotkey(hotkey));
}
