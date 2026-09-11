import type { Hotkey } from "@tanstack/react-hotkeys";

export const PLAYER_HOTKEYS = {
  toggle: "Space",
  next: "Shift+ArrowRight",
  previous: "Shift+ArrowLeft",
  shuffle: "S",
  repeat: "R",
  louder: "Shift+ArrowUp",
  quieter: "Shift+ArrowDown",
} as const satisfies Record<string, Hotkey>;
