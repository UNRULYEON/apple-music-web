import { getMusicKit } from "@/lib/music-kit/instance";

export interface PlaybackTime {
  position: number;
  duration: number;
}

// the time moves many times a second, so it lives apart from the player state and
// only the progress bar listens to it
const TIME_EVENTS = [
  "playbackTimeDidChange",
  "playbackDurationDidChange",
  "nowPlayingItemDidChange",
] as const;

export const NO_TIME: PlaybackTime = { position: 0, duration: 0 };

let time = NO_TIME;
let instance: MusicKit.MusicKitInstance | undefined;
let listening = false;

const listeners = new Set<() => void>();

export function subscribeToPlaybackTime(listener: () => void): () => void {
  listeners.add(listener);
  void listen();

  return () => {
    listeners.delete(listener);
  };
}

export function readPlaybackTime(): PlaybackTime {
  return time;
}

export function readInitialPlaybackTime(): PlaybackTime {
  return NO_TIME;
}

// only for the tests, which need a store that forgets what an earlier test taught it
export function resetPlaybackTime(): void {
  time = NO_TIME;
  instance = undefined;
  listening = false;
  listeners.clear();
}

async function listen(): Promise<void> {
  if (listening) {
    return;
  }

  listening = true;

  const music = await getMusicKit();
  instance = music;

  for (const event of TIME_EVENTS) {
    music.addEventListener(event, readTime);
  }

  readTime();
}

function readTime(): void {
  const music = instance;

  if (!music) {
    return;
  }

  const position = readSeconds(music.currentPlaybackTime);
  const duration = readSeconds(music.currentPlaybackDuration);

  if (position === time.position && duration === time.duration) {
    return;
  }

  time = { position, duration };

  for (const listener of listeners) {
    listener();
  }
}

// MusicKit leaves both of these undefined before it has a song open
function readSeconds(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(value ?? 0, 0) : 0;
}
