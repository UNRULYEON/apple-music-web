import {
  ArrowDown01Icon,
  Cancel01Icon,
  Loading03Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  Playlist03Icon,
  PreviousIcon,
  RepeatIcon,
  RepeatOne02Icon,
  ShuffleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { MeshGradient } from "@paper-design/shaders-react";
import { useHotkey } from "@tanstack/react-hotkeys";
import { AnimatePresence, mixColor, motion, type Transition, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useAuthStatus,
  useIsMobile,
  usePlayer,
  usePlayerHotkeys,
  useSignedInQuery,
  useView,
} from "@/hooks";
import { PLAYER_HOTKEYS } from "@/lib/hotkeys";
import {
  EASE,
  TRANSITION,
  TRANSITION_CLOSE,
  TRANSITION_REVEAL,
  TRANSITION_SWAP,
} from "@/lib/motion";
import { songArtistsQuery } from "@/lib/music-kit/artists";
import type { QueueSource } from "@/lib/music-kit/playback";
import type { RepeatMode } from "@/lib/music-kit/player-state";
import { isPlaylistType } from "@/lib/music-kit/playlists";
import { type Artist, type Artwork, artworkColors } from "@/lib/music-kit/resource";
import { songSourceQuery } from "@/lib/music-kit/song-source";
import { cn } from "@/lib/utils";
import { ArtistLinks } from "./artist-links";
import { ArtworkImage } from "./artwork";
import { PlayerProgress, PlayerProgressStacked } from "./player-progress";
import { PlayerVolume, PlayerVolumeSlider } from "./player-volume";

const ARTWORK_SIZE = 64;
const EXPANDED_ARTWORK_SIZE = 512;

const META_WIDTH = 256;

export const PLAYER_SPACE = 96;

const HIDDEN = { opacity: 0, y: 16, scale: 0.97, filter: "blur(2px)" };
const SHOWN = { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" };
const NO_TRANSITION = { duration: 0 } as const;

const BLURRED = { opacity: 0, filter: "blur(2px)" };
const SHARP = { opacity: 1, filter: "blur(0px)" };

const ICON_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ICON_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const ART_HIDDEN = { opacity: 0, scale: 0.96, filter: "blur(2px)" };
const ART_SHOWN = { opacity: 1, scale: 1, filter: "blur(0px)" };

const DETAILS_HIDDEN = { opacity: 0, y: 12, filter: "blur(2px)" };
const DETAILS_SHOWN = { opacity: 1, y: 0, filter: "blur(0px)" };

const BACKDROP_OPACITY = 0.28;
const BACKDROP_WASH = 900;
const BACKDROP_CATCH = 320;
const BACKDROP_STEPS = 12;
const BACKDROP_STEP = 80;
const BACKDROP_PIXELS = 640 * 360;
const BACKDROP_SPEED = 0.4;
const BACKDROP_FADE = { duration: BACKDROP_WASH / 1000, ease: EASE } as const;

const BAR_GAP = 16;

const GROUP_COLLAPSED = { width: 0, opacity: 0, filter: "blur(2px)" };
const GROUP_EXPANDED = { width: "auto", opacity: 1, filter: "blur(0px)" };

const ROW_COLLAPSED = { height: 0, opacity: 0, filter: "blur(2px)" };
const ROW_EXPANDED = { height: "auto", opacity: 1, filter: "blur(0px)" };

const GROUP_AT_START = { ...GROUP_COLLAPSED, marginInlineStart: 0 };
const GROUP_AFTER_START = { ...GROUP_EXPANDED, marginInlineStart: BAR_GAP };
const GROUP_AT_END = { ...GROUP_COLLAPSED, marginInlineEnd: 0 };
const GROUP_BEFORE_END = { ...GROUP_EXPANDED, marginInlineEnd: BAR_GAP };

const FADED = { opacity: 0 };
const OPAQUE = { opacity: 1 };

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

const ARTWORK_LAYOUT = "player-artwork";

const CONTROLS =
  'button, a, input, [role="slider"], [role="dialog"], [role="menu"], [data-slot="slider-control"]';

function keepControlMenus(event: { target: EventTarget | null; preventBaseUIHandler: () => void }) {
  if (isControl(event.target)) {
    event.preventBaseUIHandler();
  }
}

function isControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(CONTROLS) !== null;
}

const REPEAT_LABELS: Record<RepeatMode, string> = {
  off: "Repeat off",
  queue: "Repeat the queue",
  song: "Repeat the song",
};

type ControlSize = "icon-xs" | "icon" | "icon-lg" | "icon-xl";

interface ControlProps {
  size?: ControlSize;
  iconSize?: number;
}

function usePlayingFrom(): QueueSource | undefined {
  const { source, nowPlaying } = usePlayer();
  const song = nowPlaying?.playId ?? nowPlaying?.id;
  const { data: found } = useSignedInQuery(songSourceQuery(source ? undefined : song));

  return source ?? found ?? undefined;
}

function useNowPlayingArtists(): Artist[] | undefined {
  const { nowPlaying } = usePlayer();
  const known = nowPlaying?.artists;
  const song = known && known.length > 0 ? undefined : (nowPlaying?.playId ?? nowPlaying?.id);
  const { data: found } = useSignedInQuery(songArtistsQuery(song));

  return known && known.length > 0 ? known : found;
}

function sourceLabel(name: string, source: QueueSource): string {
  return isPlaylistType(source.type) ? `${name}. Show the playlist.` : `${name}. Show the album.`;
}

function PlayingFrom({
  className,
  hoverClassName,
  name,
  onNavigate,
  children,
}: {
  className?: string;
  hoverClassName?: string;
  name: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const source = usePlayingFrom();
  const { open } = useView();

  if (!source) {
    return <div className={className}>{children}</div>;
  }

  return (
    <button
      type="button"
      aria-label={sourceLabel(name, source)}
      className={cn("cursor-pointer rounded-sm text-left", FOCUS_RING, className, hoverClassName)}
      onClick={() => {
        open({ name: "detail", type: source.type, id: source.id });
        onNavigate?.();
      }}
    >
      {children}
    </button>
  );
}

function ArtworkStack({
  artwork,
  size,
  iconSize,
  className,
  blurs = true,
}: {
  artwork?: Artwork;
  size: number;
  iconSize: number;
  className: string;
  blurs?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const soft = blurs && !prefersReducedMotion;
  const hidden = soft ? ART_HIDDEN : FADED;
  const shown = soft ? ART_SHOWN : OPAQUE;

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={artwork?.url ?? "no-artwork"}
        data-slot="player-artwork"
        className="absolute inset-0"
        initial={hidden}
        animate={shown}
        exit={hidden}
        transition={prefersReducedMotion ? NO_TRANSITION : TRANSITION_SWAP}
      >
        <ArtworkImage
          artwork={artwork}
          size={size}
          iconSize={iconSize}
          className={className}
          blurs={blurs}
        />
      </motion.div>
    </AnimatePresence>
  );
}

function NowPlayingArtwork({
  className,
  size,
  iconSize,
  artworkClassName,
  transition,
  onClick,
  label,
  blurs,
}: {
  className: string;
  size: number;
  iconSize: number;
  artworkClassName: string;
  transition: Transition;
  onClick?: () => void;
  label?: string;
  blurs?: boolean;
}) {
  const { nowPlaying } = usePlayer();
  const prefersReducedMotion = useReducedMotion();

  const stack = (
    <ArtworkStack
      artwork={nowPlaying?.artwork}
      size={size}
      iconSize={iconSize}
      className={artworkClassName}
      blurs={blurs}
    />
  );

  return (
    <motion.div
      layoutId={prefersReducedMotion ? undefined : ARTWORK_LAYOUT}
      className={cn("relative shrink-0", className)}
      transition={transition}
    >
      {onClick ? (
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={cn(
            "absolute inset-0 cursor-pointer rounded-xl",
            "transition-transform duration-(--duration-quick) ease-(--ease-smooth-out) hover:scale-101 motion-reduce:transition-none",
            FOCUS_RING,
          )}
        >
          {stack}
        </button>
      ) : (
        stack
      )}
    </motion.div>
  );
}

function ShuffleButton({ size = "icon-xs", iconSize = 16 }: ControlProps) {
  const { isShuffled, toggleShuffle } = usePlayer();

  return (
    <Button
      onClick={toggleShuffle}
      variant="ghost"
      size={size}
      aria-label="Shuffle"
      aria-keyshortcuts={PLAYER_HOTKEYS.shuffle}
      aria-pressed={isShuffled}
    >
      <HugeiconsIcon
        icon={ShuffleIcon}
        size={iconSize}
        strokeWidth={2}
        className={cn(
          "transition-opacity duration-(--duration-quick) ease-(--ease-smooth-out) motion-reduce:transition-none",
          isShuffled ? "opacity-100" : "opacity-40",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}

function RepeatButton({ size = "icon-xs", iconSize = 16 }: ControlProps) {
  const { repeat, cycleRepeat } = usePlayer();

  return (
    <Button
      onClick={cycleRepeat}
      variant="ghost"
      size={size}
      aria-label={REPEAT_LABELS[repeat]}
      aria-keyshortcuts={PLAYER_HOTKEYS.repeat}
      aria-pressed={repeat !== "off"}
    >
      <HugeiconsIcon
        icon={repeat === "song" ? RepeatOne02Icon : RepeatIcon}
        size={iconSize}
        strokeWidth={2}
        className={cn(
          "transition-opacity duration-(--duration-quick) ease-(--ease-smooth-out) motion-reduce:transition-none",
          repeat === "off" ? "opacity-40" : "opacity-100",
        )}
        aria-hidden="true"
      />
    </Button>
  );
}

function PreviousButton({ size = "icon-xs", iconSize = 16 }: ControlProps) {
  const { canSkipPrevious, previous } = usePlayer();

  return (
    <Button
      onClick={previous}
      disabled={!canSkipPrevious}
      variant="ghost"
      size={size}
      aria-label="Previous song"
      aria-keyshortcuts={PLAYER_HOTKEYS.previous}
    >
      <HugeiconsIcon icon={PreviousIcon} size={iconSize} strokeWidth={2} aria-hidden="true" />
    </Button>
  );
}

function PlayButton({ size = "icon", iconSize = 16 }: ControlProps) {
  const { isPlaying, isLoading, toggle } = usePlayer();
  const prefersReducedMotion = useReducedMotion();

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size={size}
      aria-label={isLoading ? "Stop loading" : isPlaying ? "Pause" : "Play"}
      aria-keyshortcuts={PLAYER_HOTKEYS.toggle}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={isLoading ? "loading" : isPlaying ? "pause" : "play"}
          initial={ICON_HIDDEN}
          animate={ICON_SHOWN}
          exit={ICON_HIDDEN}
          transition={prefersReducedMotion ? NO_TRANSITION : TRANSITION}
        >
          <HugeiconsIcon
            icon={isLoading ? Loading03Icon : isPlaying ? PauseIcon : PlayIcon}
            size={iconSize}
            strokeWidth={2}
            className={cn(isLoading && "animate-spin")}
            aria-hidden="true"
          />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}

function NextButton({ size = "icon-xs", iconSize = 16 }: ControlProps) {
  const { canSkipNext, next } = usePlayer();

  return (
    <Button
      onClick={next}
      disabled={!canSkipNext}
      variant="ghost"
      size={size}
      aria-label="Next song"
      aria-keyshortcuts={PLAYER_HOTKEYS.next}
    >
      <HugeiconsIcon icon={NextIcon} size={iconSize} strokeWidth={2} aria-hidden="true" />
    </Button>
  );
}

function colorPairs(from: string[], to: string[]): [string, string][] {
  const length = Math.max(from.length, to.length);

  return Array.from({ length }, (_, i) => [
    from[Math.min(i, from.length - 1)] as string,
    to[Math.min(i, to.length - 1)] as string,
  ]);
}

function washedOut(at: number): number {
  return 1 - (1 - at) ** 5;
}

function useWashedColors(colors: string[]): string[] {
  const [shown, setShown] = useState(colors);
  const prefersReducedMotion = useReducedMotion();
  const onScreen = useRef(colors);
  const asked = useRef(colors);
  const isWashing = useRef(false);
  const wanted = colors.join();

  asked.current = colors;

  useEffect(() => {
    const to = asked.current;
    const from = onScreen.current;

    if (from.join() === wanted) {
      return;
    }

    if (prefersReducedMotion || from.length === 0 || to.length === 0) {
      onScreen.current = to;
      setShown(to);
      return;
    }

    const span = isWashing.current ? BACKDROP_CATCH : BACKDROP_WASH;
    const gap = Math.min(BACKDROP_STEP, span / BACKDROP_STEPS);
    const mixers = colorPairs(from, to).map(([a, b]) => mixColor(a, b));
    const started = performance.now();
    let sent = 0;
    let frame = 0;

    isWashing.current = true;

    function step(now: number) {
      const at = Math.min((now - started) / span, 1);

      if (at < 1 && now - sent < gap) {
        frame = requestAnimationFrame(step);
        return;
      }

      sent = now;

      const next = at === 1 ? to : mixers.map((mixer) => mixer(washedOut(at)) as string);

      onScreen.current = next;
      setShown(next);

      if (at < 1) {
        frame = requestAnimationFrame(step);
        return;
      }

      isWashing.current = false;
    }

    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [wanted, prefersReducedMotion]);

  return shown;
}

function ExpandedBackdrop() {
  const { nowPlaying } = usePlayer();
  const prefersReducedMotion = useReducedMotion();
  const colors = useMemo(() => artworkColors(nowPlaying?.artwork), [nowPlaying?.artwork]);
  const washed = useWashedColors(colors);
  const wash = prefersReducedMotion ? NO_TRANSITION : BACKDROP_FADE;

  return (
    <AnimatePresence>
      {washed.length > 0 && (
        <motion.div
          data-slot="player-backdrop"
          className="pointer-events-none absolute inset-0"
          initial={FADED}
          animate={{ opacity: BACKDROP_OPACITY, transition: wash }}
          exit={{ ...FADED, transition: prefersReducedMotion ? NO_TRANSITION : TRANSITION_CLOSE }}
        >
          <MeshGradient
            className="size-full"
            colors={washed}
            distortion={0}
            swirl={0}
            grainMixer={1}
            grainOverlay={1}
            speed={prefersReducedMotion ? 0 : BACKDROP_SPEED}
            minPixelRatio={1}
            maxPixelCount={BACKDROP_PIXELS}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExpandedPlayer({ onCollapse }: { onCollapse: () => void }) {
  const { nowPlaying, isPlaying, isLoading, toggle } = usePlayer();
  const artists = useNowPlayingArtists();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onCollapse();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCollapse]);

  if (!nowPlaying) {
    return null;
  }

  const blurred = prefersReducedMotion ? FADED : BLURRED;
  const sharp = prefersReducedMotion ? OPAQUE : SHARP;
  const detailsHidden = prefersReducedMotion ? FADED : DETAILS_HIDDEN;
  const detailsShown = prefersReducedMotion ? OPAQUE : DETAILS_SHOWN;

  const openTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_REVEAL;
  const closeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_CLOSE;
  const swapTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_SWAP;

  return (
    <motion.section
      aria-label="Now playing"
      className={cn(
        "fixed inset-0 z-50 flex flex-col select-none",
        "bg-neutral-100 theme-fade dark:bg-neutral-950",
      )}
      initial={FADED}
      animate={{ ...OPAQUE, transition: openTransition }}
      exit={{ ...FADED, transition: closeTransition }}
    >
      <ExpandedBackdrop />

      <div className="relative flex justify-center p-2 short:p-1">
        <Button
          onClick={onCollapse}
          variant="ghost"
          size="icon"
          aria-label="Collapse the player"
          aria-keyshortcuts={PLAYER_HOTKEYS.expand}
          className="cursor-s-resize"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>

      <div
        className={cn(
          "relative flex min-h-0 grow flex-col items-center justify-center-safe px-6",
          "gap-8 pb-12 short:gap-4 short:pb-4",
          "short-wide:flex-row short-wide:gap-6",
          "overflow-y-auto overscroll-contain",
        )}
      >
        <NowPlayingArtwork
          className={cn(
            "aspect-square w-[min(72vw,44vh,20rem)]",
            "short:w-[min(72vw,calc(100svh-var(--player-chrome)))]",
            "short-wide:w-[min(40vw,70vh)]",
          )}
          size={EXPANDED_ARTWORK_SIZE}
          iconSize={48}
          artworkClassName="size-full rounded-xl"
          transition={openTransition}
          blurs={false}
          onClick={toggle}
          label={
            isLoading ? "Stop loading the song" : isPlaying ? "Pause the song" : "Play the song"
          }
        />

        <motion.div
          className="flex w-[min(88vw,24rem)] shrink-0 flex-col items-center gap-6 short:gap-4"
          initial={detailsHidden}
          animate={{ ...detailsShown, transition: openTransition }}
          exit={{ ...detailsHidden, transition: closeTransition }}
        >
          <div className="flex w-full flex-col items-center gap-1 text-center">
            <PlayingFrom
              className="relative h-7 w-full text-center"
              hoverClassName="hover:underline"
              name={nowPlaying.name}
              onNavigate={onCollapse}
            >
              <AnimatePresence initial={false}>
                <motion.span
                  key={nowPlaying.name}
                  className="absolute inset-x-0 top-0 truncate text-lg font-bold"
                  initial={blurred}
                  animate={sharp}
                  exit={blurred}
                  transition={swapTransition}
                >
                  {nowPlaying.name}
                </motion.span>
              </AnimatePresence>
            </PlayingFrom>
            <div className="relative h-5 w-full">
              <AnimatePresence initial={false}>
                <motion.span
                  key={nowPlaying.artist?.name ?? "no-artist"}
                  className="absolute inset-x-0 top-0 truncate text-sm text-neutral-500 theme-fade-text dark:text-neutral-400"
                  initial={blurred}
                  animate={sharp}
                  exit={blurred}
                  transition={swapTransition}
                >
                  <ArtistLinks
                    artists={artists}
                    fallback={nowPlaying.artist?.name}
                    onNavigate={onCollapse}
                  />
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <PlayerProgressStacked
            className="w-full cursor-default text-xs"
            songId={nowPlaying.id}
            durationInMillis={nowPlaying.durationInMillis}
          />

          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex items-center gap-1">
              <ShuffleButton size="icon" iconSize={18} />
              <PreviousButton size="icon-lg" iconSize={22} />
              <PlayButton size="icon-xl" iconSize={26} />
              <NextButton size="icon-lg" iconSize={22} />
              <RepeatButton size="icon" iconSize={18} />
            </div>
            <PlayerVolumeSlider className="w-full cursor-default" />
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

export function Player() {
  const artists = useNowPlayingArtists();
  const { nowPlaying, close } = usePlayer();
  const status = useAuthStatus();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

  const [isExpanded, setIsExpanded] = useState(false);

  const isShown = Boolean(nowPlaying) && status !== "signed-out";

  if (!isShown && isExpanded) {
    setIsExpanded(false);
  }

  usePlayerHotkeys(isShown);

  useHotkey(PLAYER_HOTKEYS.expand, () => setIsExpanded((wasExpanded) => !wasExpanded), {
    enabled: isShown,
    requireReset: true,
  });

  const hidden = prefersReducedMotion ? FADED : HIDDEN;
  const shown = prefersReducedMotion ? OPAQUE : SHOWN;
  const blurred = prefersReducedMotion ? FADED : BLURRED;
  const sharp = prefersReducedMotion ? OPAQUE : SHARP;

  const openTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_REVEAL;
  const closeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_CLOSE;
  const swapTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION_SWAP;
  const shapeTransition = prefersReducedMotion ? NO_TRANSITION : TRANSITION;

  return (
    <AnimatePresence>
      {nowPlaying && isShown && !isExpanded && (
        <div
          key="player"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex cursor-n-resize justify-center p-2"
          onClick={(event) => {
            if (!isControl(event.target)) {
              setIsExpanded(true);
            }
          }}
        >
          <motion.div
            className="min-w-0"
            initial={hidden}
            animate={{ ...shown, transition: openTransition }}
            exit={{ ...hidden, transition: closeTransition }}
          >
            <ContextMenu>
              <ContextMenuTrigger
                render={<div />}
                onContextMenu={keepControlMenus}
                onTouchStart={keepControlMenus}
                className={cn(
                  "pointer-events-auto",
                  "flex max-w-full items-center",
                  isMobile ? "py-1 pr-4 pl-4" : "px-4 pt-0 pb-0",
                  "bg-neutral-100 dark:bg-neutral-950",
                  "border border-neutral-50 dark:border-neutral-800",
                  "theme-fade",
                  "rounded-full",
                  "select-none",
                )}
              >
                <AnimatePresence initial={false}>
                  {!isMobile && (
                    <motion.div
                      key="controls"
                      className="shrink-0 overflow-hidden"
                      initial={GROUP_AT_END}
                      animate={GROUP_BEFORE_END}
                      exit={GROUP_AT_END}
                      transition={shapeTransition}
                    >
                      <div className="flex w-max items-center">
                        <ShuffleButton />
                        <PreviousButton />
                        <PlayButton />
                        <NextButton />
                        <RepeatButton />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex min-w-0 flex-col" style={{ width: META_WIDTH }}>
                  <div
                    className={cn(
                      "flex min-w-0 items-center gap-2 pt-2",
                      isMobile ? "pb-2" : "pb-0",
                    )}
                  >
                    <NowPlayingArtwork
                      className="size-8"
                      size={ARTWORK_SIZE}
                      iconSize={16}
                      artworkClassName="size-8 rounded-sm"
                      transition={closeTransition}
                    />

                    <div className="flex min-w-0 grow flex-col">
                      <PlayingFrom
                        className="relative min-w-0 self-start"
                        hoverClassName="hover:underline"
                        name={nowPlaying.name}
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={nowPlaying.name}
                            className="block self-start truncate text-xs font-bold"
                            initial={blurred}
                            animate={sharp}
                            exit={blurred}
                            transition={swapTransition}
                          >
                            {nowPlaying.name}
                          </motion.span>
                        </AnimatePresence>
                      </PlayingFrom>
                      <div className="relative min-w-0">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={nowPlaying.artist?.name ?? "no-artist"}
                            className="block truncate text-xs text-neutral-500 theme-fade-text dark:text-neutral-400"
                            initial={blurred}
                            animate={sharp}
                            exit={blurred}
                            transition={swapTransition}
                          >
                            <ArtistLinks artists={artists} fallback={nowPlaying.artist?.name} />
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {!isMobile && (
                      <motion.div
                        key="progress"
                        className="cursor-default overflow-hidden"
                        initial={ROW_COLLAPSED}
                        animate={ROW_EXPANDED}
                        exit={ROW_COLLAPSED}
                        transition={shapeTransition}
                      >
                        <PlayerProgress
                          songId={nowPlaying.id}
                          durationInMillis={nowPlaying.durationInMillis}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence initial={false}>
                  {isMobile ? (
                    <motion.div
                      key="compact-controls"
                      className="shrink-0 overflow-hidden"
                      initial={GROUP_AT_START}
                      animate={GROUP_AFTER_START}
                      exit={GROUP_AT_START}
                      transition={shapeTransition}
                    >
                      <div className="flex w-max items-center">
                        <PlayButton size="icon-lg" />
                        <NextButton size="icon-lg" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="queue"
                      className="shrink-0 overflow-hidden"
                      initial={GROUP_AT_START}
                      animate={GROUP_AFTER_START}
                      exit={GROUP_AT_START}
                      transition={shapeTransition}
                    >
                      <div className="flex w-max items-center">
                        <Button variant="ghost" size="icon" aria-label="Queue">
                          <HugeiconsIcon
                            icon={Playlist03Icon}
                            size={16}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </Button>
                        <PlayerVolume />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ContextMenuTrigger>
              <ContextMenuPopup align="start">
                <ContextMenuItem onClick={close}>
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden="true" />
                  Close Player
                </ContextMenuItem>
              </ContextMenuPopup>
            </ContextMenu>
          </motion.div>
        </div>
      )}
      {nowPlaying && isShown && isExpanded && (
        <ExpandedPlayer key="expanded" onCollapse={() => setIsExpanded(false)} />
      )}
    </AnimatePresence>
  );
}
