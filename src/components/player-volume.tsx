import { VolumeHighIcon, VolumeLowIcon, VolumeMute02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RollingNumber } from "@kitlangton/rolling-number/react";
import { useHotkeys } from "@tanstack/react-hotkeys";
import { type RefObject, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PopoverPrimitive } from "@/components/ui/popover";
import { SliderPrimitive } from "@/components/ui/slider";
import { useVolume } from "@/hooks";
import { PLAYER_HOTKEYS } from "@/lib/hotkeys";
import { ROLL_DURATION } from "@/lib/motion";
import { cn } from "@/lib/utils";

const PERCENT = 100;

const VOLUME_STEP = 0.01;

const LARGE_VOLUME_STEP = 0.1;

const HALF = 0.5;

const HINT_HOLD = 700;

const HINT_OFFSET = 24;

export function PlayerVolumeSlider({ className }: { className?: string }) {
  const { volume, change } = useVolume();

  useVolumeKeys((by) => change(nudge(volume, by)));

  return (
    <div className={cn("flex min-w-0 items-center gap-2 px-12", className)}>
      <HugeiconsIcon
        icon={VolumeMute02Icon}
        size={14}
        strokeWidth={2}
        className="shrink-0 opacity-40"
        aria-hidden="true"
      />
      <VolumeSlider
        volume={volume}
        change={change}
        orientation="horizontal"
        className="min-w-0 grow"
      />
      <HugeiconsIcon
        icon={VolumeHighIcon}
        size={14}
        strokeWidth={2}
        className="shrink-0 opacity-40"
        aria-hidden="true"
      />
    </div>
  );
}

export function PlayerVolume() {
  const { volume, change } = useVolume();
  const [isOpen, setIsOpen] = useState(false);
  const [isHinted, setIsHinted] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function adjust(by: number) {
    change(nudge(volume, by));
    setIsHinted(true);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setIsHinted(false), HINT_HOLD);
  }

  useVolumeKeys(adjust);

  return (
    <>
      <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <PopoverPrimitive.Trigger
          ref={trigger}
          render={
            <Button variant="ghost" size="icon" aria-label={`Volume, ${percent(volume)} percent`} />
          }
        >
          <HugeiconsIcon icon={volumeIcon(volume)} size={16} strokeWidth={2} aria-hidden="true" />
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Positioner sideOffset={6}>
            <PopoverPrimitive.Popup
              className={cn(
                "rounded-full border border-neutral-200 bg-neutral-100 px-0.5 py-2 dark:border-neutral-800 dark:bg-neutral-950",
                "origin-(--transform-origin) will-change-[transform,opacity]",
                "transition-[transform,opacity,background-color,border-color] duration-(--dropdown-open-dur) ease-(--dropdown-ease)",
                "data-starting-style:scale-(--dropdown-pre-scale) data-starting-style:opacity-0",
                "data-ending-style:scale-(--dropdown-closing-scale) data-ending-style:opacity-0",
                "data-ending-style:duration-(--dropdown-close-dur)",
                "motion-reduce:transition-none",
              )}
            >
              <VolumeSlider volume={volume} change={change} />
            </PopoverPrimitive.Popup>
          </PopoverPrimitive.Positioner>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <VolumeHint
        anchor={trigger}
        volume={volume}
        open={isHinted && !isOpen}
        onClose={() => setIsHinted(false)}
      />
    </>
  );
}

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
              "rounded-full border border-neutral-50 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950",
              "transition-[translate,opacity,background-color,border-color] duration-(--hint-in-dur) ease-(--hint-ease)",
              "data-starting-style:translate-y-(--hint-in-offset) data-starting-style:opacity-0",
              "data-ending-style:opacity-0",
              "data-ending-style:duration-(--hint-out-dur)",
              "motion-reduce:translate-y-0!",
            )}
          >
            <RollingNumber value={percent(volume)} duration={ROLL_DURATION} />%
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

function useVolumeKeys(adjust: (by: number) => void) {
  useHotkeys(
    [
      { hotkey: PLAYER_HOTKEYS.louder, callback: () => adjust(LARGE_VOLUME_STEP) },
      { hotkey: PLAYER_HOTKEYS.quieter, callback: () => adjust(-LARGE_VOLUME_STEP) },
    ],
    { conflictBehavior: "replace" },
  );
}

function VolumeSlider({
  volume,
  change,
  orientation = "vertical",
  className,
}: {
  volume: number;
  change: (volume: number) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      className={className}
      value={volume}
      min={0}
      max={1}
      step={VOLUME_STEP}
      largeStep={LARGE_VOLUME_STEP}
      orientation={orientation}
      onValueChange={change}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className={cn(
          "group flex touch-none select-none",
          "data-[orientation=vertical]:h-24 data-[orientation=vertical]:w-4 data-[orientation=vertical]:justify-center",
          "data-[orientation=horizontal]:w-full data-[orientation=horizontal]:items-center data-[orientation=horizontal]:py-2",
          orientation === "vertical" ? "cursor-ns-resize" : "cursor-ew-resize",
        )}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative rounded-full bg-neutral-300 theme-fade dark:bg-neutral-800",
            "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1",
            "data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full",
          )}
        >
          <SliderPrimitive.Indicator
            className={cn(
              "rounded-full bg-neutral-900 theme-fade dark:bg-neutral-100",
              "data-[orientation=horizontal]:h-full",
            )}
          />
          <SliderPrimitive.Thumb
            index={0}
            aria-label="Volume level"
            getAriaValueText={(_, value) => `${percent(value)} percent`}
            className={cn(
              "rounded-full bg-neutral-900 dark:bg-neutral-100",
              "transition-[scale,opacity,background-color] outline-none",
              "has-focus-visible:ring-2 has-focus-visible:ring-neutral-500",
              "data-[orientation=horizontal]:size-2.5",
              "data-[orientation=horizontal]:opacity-0 group-hover:data-[orientation=horizontal]:opacity-100",
              "has-focus-visible:opacity-100 data-dragging:scale-125 data-dragging:opacity-100",
            )}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
