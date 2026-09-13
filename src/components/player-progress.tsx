import { usePlaybackTime } from "@/hooks";
import { clockTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RollingNumber } from "@kitlangton/rolling-number/react";
import { useEffect, useState } from "react";
import { SliderPrimitive } from "./ui/slider";

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

// as long as the rest of the player takes to move, and short enough that a second is
// over before the next one arrives
const ROLL = 240;

// the seconds keep both places, so 0:07 does not turn into 0:7
const SECONDS_FORMAT = { minimumIntegerDigits: 2 } as const;

// the minutes and the seconds roll on their own, so a minute that does not change
// stands still while the seconds move under it
function RollingClock({ seconds, sign, slot }: { seconds: number; sign?: string; slot: string }) {
  const whole = Math.max(Math.round(seconds), 0);

  return (
    <span data-slot={slot}>
      {sign}
      <RollingNumber value={Math.floor(whole / SECONDS_PER_MINUTE)} duration={ROLL} />:
      <RollingNumber value={whole % SECONDS_PER_MINUTE} format={SECONDS_FORMAT} duration={ROLL} />
    </span>
  );
}

// arrow keys move a second, page keys a quarter minute
const LARGE_STEP = 15;

// how near MusicKit must come to the place a person let the thumb go before the bar
// follows MusicKit again. A seek takes a moment to land and the bar must not fall
// back to where the song was in the meantime.
const LANDED = 1.5;

interface PlayerProgressProps {
  songId: string;
  durationInMillis?: number;
  className?: string;
}

export function PlayerProgress({ songId, durationInMillis, className }: PlayerProgressProps) {
  const { position, duration, seek } = usePlaybackTime();

  // where a person has put the thumb, which runs ahead of where MusicKit has arrived
  const [wanted, setWanted] = useState<number | undefined>(undefined);

  // the length of the song, or what is left of it, which a person picks
  const [showsLeft, setShowsLeft] = useState(false);

  // a new song starts at the beginning, so a place asked for in the song before it
  // must go, while the time a person picked stays
  const [seen, setSeen] = useState(songId);

  if (seen !== songId) {
    setSeen(songId);
    setWanted(undefined);
  }

  // MusicKit gives the length only once it has the song open, the catalog gives it
  // before that, so a song that has not started still shows how long it is
  const length = duration || (durationInMillis ?? 0) / MILLIS_PER_SECOND;
  const at = Math.min(wanted ?? position, length);
  const left = Math.max(length - at, 0);

  useEffect(() => {
    if (wanted !== undefined && Math.abs(position - wanted) < LANDED) {
      setWanted(undefined);
    }
  }, [position, wanted]);

  return (
    <div className={cn("flex items-center gap-1 min-w-0 text-[9px] tabular-nums", className)}>
      <span className="shrink-0 text-neutral-500 dark:text-neutral-400 theme-fade-text">
        <RollingClock seconds={at} slot="player-elapsed" />
      </span>
      <SliderPrimitive.Root
        className="grow min-w-0 px-1"
        value={at}
        min={0}
        max={length || 1}
        step={1}
        largeStep={LARGE_STEP}
        thumbAlignment="edge"
        disabled={length === 0}
        onValueChange={setWanted}
        onValueCommitted={seek}
      >
        <SliderPrimitive.Control className="group flex w-full touch-none select-none items-center py-2 data-disabled:pointer-events-none data-disabled:opacity-40">
          <SliderPrimitive.Track className="relative h-1 w-full rounded-full bg-neutral-300 dark:bg-neutral-800 theme-fade">
            <SliderPrimitive.Indicator className="h-full rounded-full bg-neutral-900 dark:bg-neutral-100 theme-fade" />
            <SliderPrimitive.Thumb
              index={0}
              aria-label="Seek"
              getAriaValueText={(_, value) => clockTime(value)}
              className={cn(
                "size-2.5 rounded-full bg-neutral-900 dark:bg-neutral-100",
                "outline-none transition-[scale,opacity,background-color]",
                "opacity-0 group-hover:opacity-100 data-dragging:opacity-100 has-focus-visible:opacity-100",
                "data-dragging:scale-125",
                "has-focus-visible:ring-2 has-focus-visible:ring-neutral-500",
              )}
            />
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
      <button
        type="button"
        onClick={() => setShowsLeft(!showsLeft)}
        aria-label={
          showsLeft
            ? `${clockTime(left)} left. Show the length of the song.`
            : `The song is ${clockTime(length)} long. Show what is left of it.`
        }
        className={cn(
          "shrink-0 text-right tabular-nums",
          "text-neutral-500 dark:text-neutral-400",
          "transition-colors duration-(--duration-quick) ease-(--ease-smooth-out) motion-reduce:transition-none hover:text-neutral-900 dark:hover:text-neutral-100",
          "outline-none focus-visible:ring-2 focus-visible:ring-neutral-500",
        )}
      >
        <RollingClock
          seconds={showsLeft ? left : length}
          sign={showsLeft ? "-" : undefined}
          slot="player-length"
        />
      </button>
    </div>
  );
}
