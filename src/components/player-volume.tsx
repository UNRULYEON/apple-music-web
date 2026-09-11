import { useVolume } from "@/hooks";
import { PLAYER_HOTKEYS } from "@/lib/hotkeys";
import { cn } from "@/lib/utils";
import { VolumeHighIcon, VolumeLowIcon, VolumeMute02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RollingNumber } from "@kitlangton/rolling-number/react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Button } from "./ui/button";
import { PopoverPrimitive } from "./ui/popover";
import { SliderPrimitive } from "./ui/slider";

const PERCENT = 100;
const STEP = 0.01;

// arrow keys move a hundredth, page keys a tenth
const LARGE_STEP = 0.1;

const HALF = 0.5;

const HINT_HOLD = 700;
const HINT_OFFSET = 24;
const ROLL = 240;

function volumeIcon(volume: number) {
  if (volume === 0) {
    return VolumeMute02Icon;
  }

  return volume < HALF ? VolumeLowIcon : VolumeHighIcon;
}

function percent(volume: number): number {
  return Math.round(volume * PERCENT);
}

function nudge(volume: number, by: number): number {
  return Math.min(Math.max(percent(volume + by) / PERCENT, 0), 1);
}

function VolumeHint({
  anchor,
  volume,
  open,
  onClose,
}: {
  anchor: RefObject<HTMLButtonElement | null>;
  volume: number;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          anchor={anchor}
          sideOffset={HINT_OFFSET}
          className="pointer-events-none"
        >
          <PopoverPrimitive.Popup
            role="status"
            initialFocus={false}
            finalFocus={false}
            className={cn(
              "px-2 py-1 text-xs font-medium tabular-nums select-none",
              "bg-neutral-100 dark:bg-neutral-950 border border-neutral-50 dark:border-neutral-800 rounded-full",
              "transition-[translate,opacity] duration-(--hint-in-dur) ease-(--hint-ease)",
              "data-starting-style:translate-y-(--hint-in-offset) data-starting-style:opacity-0",
              "data-ending-style:opacity-0",
              "data-ending-style:duration-(--hint-out-dur)",
              "motion-reduce:translate-y-0!",
            )}
          >
            <RollingNumber value={percent(volume)} duration={ROLL} />%
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export function PlayerVolume() {
  const { volume, change } = useVolume();
  const [isOpen, setOpen] = useState(false);
  const [isHinted, setHinted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function adjust(by: number) {
    change(nudge(volume, by));
    setHinted(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHinted(false), HINT_HOLD);
  }

  useHotkeys([
    { hotkey: PLAYER_HOTKEYS.louder, callback: () => adjust(LARGE_STEP) },
    { hotkey: PLAYER_HOTKEYS.quieter, callback: () => adjust(-LARGE_STEP) },
  ]);

  return (
    <>
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          ref={trigger}
          render={
            <Button variant="ghost" size="icon" aria-label={`Volume, ${percent(volume)} percent`} />
          }
        >
          <HugeiconsIcon icon={volumeIcon(volume)} size={16} strokeWidth={2} />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner sideOffset={24}>
            <PopoverPrimitive.Popup
              className={cn(
                "px-0.5 py-2 bg-neutral-100 dark:bg-neutral-950 border border-neutral-50 dark:border-neutral-800 rounded-full",
                // it grows out of the corner of the button it belongs to, which the
                // positioner works out again whenever the popup has to move
                "origin-(--transform-origin) will-change-[transform,opacity]",
                "transition-[transform,opacity] duration-(--dropdown-open-dur) ease-(--dropdown-ease)",
                "data-starting-style:scale-(--dropdown-pre-scale) data-starting-style:opacity-0",
                "data-ending-style:scale-(--dropdown-closing-scale) data-ending-style:opacity-0",
                "data-ending-style:duration-(--dropdown-close-dur)",
                "motion-reduce:transition-none",
              )}
            >
              <SliderPrimitive.Root
                value={volume}
                min={0}
                max={1}
                step={STEP}
                largeStep={LARGE_STEP}
                orientation="vertical"
                thumbAlignment="edge"
                onValueChange={change}
              >
                <SliderPrimitive.Control className="group flex h-24 w-4 touch-none select-none justify-center">
                  <SliderPrimitive.Track className="relative h-full w-1 rounded-full bg-neutral-300 dark:bg-neutral-800">
                    <SliderPrimitive.Indicator className="rounded-full bg-neutral-900 dark:bg-neutral-100" />
                    <SliderPrimitive.Thumb
                      index={0}
                      aria-label="Volume level"
                      getAriaValueText={(_, value) => `${percent(value)} percent`}
                      className={cn(
                        "rounded-full bg-neutral-900 dark:bg-neutral-100",
                        "outline-none transition-[scale]",
                        "has-focus-visible:ring-2 has-focus-visible:ring-neutral-500",
                      )}
                    />
                  </SliderPrimitive.Track>
                </SliderPrimitive.Control>
              </SliderPrimitive.Root>
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <VolumeHint
        anchor={trigger}
        volume={volume}
        open={isHinted && !isOpen}
        onClose={() => setHinted(false)}
      />
    </>
  );
}
