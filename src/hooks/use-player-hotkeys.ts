import { useHotkeys } from "@tanstack/react-hotkeys";
import { PLAYER_HOTKEYS } from "@/lib/hotkeys";
import { usePlayer } from "./use-player";

const PRESSED_BY_SPACE =
  "button, summary, [role='button'], [role='checkbox'], [role='switch'], [role='radio'], [role='tab'], [role='option'], [role^='menuitem']";

function isReachedWithKeys(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.matches(PRESSED_BY_SPACE) &&
    target.matches(":focus-visible")
  );
}

export function usePlayerHotkeys(enabled: boolean): void {
  const { canSkipNext, canSkipPrevious, toggle, next, previous, toggleShuffle, cycleRepeat } =
    usePlayer();

  useHotkeys(
    [
      {
        hotkey: PLAYER_HOTKEYS.toggle,
        callback: (event) => {
          if (isReachedWithKeys(event.target)) {
            return;
          }

          event.preventDefault();

          if (!event.repeat) {
            toggle();
          }
        },
        options: { preventDefault: false },
      },
      {
        hotkey: PLAYER_HOTKEYS.next,
        callback: () => canSkipNext && next(),
      },
      {
        hotkey: PLAYER_HOTKEYS.previous,
        callback: () => canSkipPrevious && previous(),
      },
      {
        hotkey: PLAYER_HOTKEYS.shuffle,
        callback: toggleShuffle,
        options: { requireReset: true },
      },
      {
        hotkey: PLAYER_HOTKEYS.repeat,
        callback: cycleRepeat,
        options: { requireReset: true },
      },
    ],
    { enabled },
  );
}
