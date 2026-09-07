import { useVolume } from "@/hooks";
import { cn } from "@/lib/utils";
import { VolumeHighIcon, VolumeLowIcon, VolumeMute02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "./ui/button";
import { PopoverPrimitive } from "./ui/popover";
import { SliderPrimitive } from "./ui/slider";

const PERCENT = 100;
const STEP = 0.01;

// arrow keys move a hundredth, page keys a tenth
const LARGE_STEP = 0.1;

const HALF = 0.5;

function volumeIcon(volume: number) {
  if (volume === 0) {
    return VolumeMute02Icon;
  }

  return volume < HALF ? VolumeLowIcon : VolumeHighIcon;
}

function percent(volume: number): number {
  return Math.round(volume * PERCENT);
}

export function PlayerVolume() {
  const { volume, change } = useVolume();

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
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
  );
}
