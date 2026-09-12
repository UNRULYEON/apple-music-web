import { artworkUrl } from "@/lib/music-kit/resource";
import type { Song } from "@/lib/music-kit/track";

const SIZES = [96, 192, 512];
const TYPE = "image/jpeg";

export interface MediaKeys {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (to: number) => void;
}

const ACTIONS = ["play", "pause", "nexttrack", "previoustrack", "seekto"] as const;

function session(): MediaSession | undefined {
  return typeof navigator === "undefined" ? undefined : navigator.mediaSession;
}

export function showNowPlaying(song?: Song): void {
  const media = session();

  if (!media) {
    return;
  }

  if (!song) {
    media.metadata = null;
    return;
  }

  const art = song.artwork;

  try {
    media.metadata = new MediaMetadata({
      title: song.name,
      artist: song.artist?.name,
      artwork: art
        ? SIZES.map((size) => ({
            src: artworkUrl(art, size),
            sizes: `${size}x${size}`,
            type: TYPE,
          }))
        : [],
    });
  } catch {
    return;
  }
}

export function showPlaybackState(isPlaying: boolean, hasSong: boolean): void {
  const media = session();

  if (!media) {
    return;
  }

  if (!hasSong) {
    media.playbackState = "none";
    return;
  }

  media.playbackState = isPlaying ? "playing" : "paused";
}

export function showPosition(position: number, duration: number): void {
  const media = session();

  if (!media?.setPositionState) {
    return;
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    media.setPositionState();
    return;
  }

  try {
    media.setPositionState({
      duration,
      position: Math.min(Math.max(position, 0), duration),
      playbackRate: 1,
    });
  } catch {
    return;
  }
}

export function handleMediaKeys(keys: MediaKeys): () => void {
  const media = session();

  if (!media) {
    return () => undefined;
  }

  const handlers: Record<(typeof ACTIONS)[number], MediaSessionActionHandler> = {
    play: keys.play,
    pause: keys.pause,
    nexttrack: keys.next,
    previoustrack: keys.previous,
    seekto: (details) => keys.seek(details.seekTime ?? 0),
  };

  for (const action of ACTIONS) {
    try {
      media.setActionHandler(action, handlers[action]);
    } catch {
      continue;
    }
  }

  return () => {
    for (const action of ACTIONS) {
      try {
        media.setActionHandler(action, null);
      } catch {
        continue;
      }
    }
  };
}
