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

// how near the song must come to the held place before the bar follows the song again.
// A seek takes a moment to land, and MusicKit reports the start of the song while it is
// on its way, which the bar must not show.
const LANDED = 1.5;

let real = NO_TIME;
let shown = NO_TIME;

// the place a song will open at. MusicKit drops a time given to a song it has not
// opened, so the app holds the place, shows it in the bar, and hands it to the song
// when it starts.
let held: number | undefined;

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
  return shown;
}

export function holdPlaybackTime(position: number): void {
  held = position;
  show();
}

export function readHeldPlaybackTime(): number | undefined {
  return held;
}

export function dropPlaybackTime(): void {
  if (held === undefined) {
    return;
  }

  held = undefined;
  show();
}

export function readInitialPlaybackTime(): PlaybackTime {
  return NO_TIME;
}

// only for the tests, which need a store that forgets what an earlier test taught it
export function resetPlaybackTime(): void {
  real = NO_TIME;
  shown = NO_TIME;
  held = undefined;
  instance = undefined;
  listening = false;
  listeners.clear();
}

async function listen(): Promise<void> {
  if (listening) {
    return;
  }

  listening = true;

  const music = await getMusicKit().catch(() => undefined);

  if (!music) {
    listening = false;
    return;
  }

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

  real = {
    position: readSeconds(music.currentPlaybackTime),
    duration: readSeconds(music.currentPlaybackDuration),
  };

  show();
}

// one object for every reader, or the store would look changed on each read. The song
// takes the bar back by itself, as soon as it arrives at the place it was given.
function show(): void {
  if (held !== undefined && real.position > 0 && Math.abs(real.position - held) < LANDED) {
    held = undefined;
  }

  const next = held === undefined ? real : { position: held, duration: real.duration };

  if (next.position === shown.position && next.duration === shown.duration) {
    return;
  }

  shown = next;

  for (const listener of listeners) {
    listener();
  }
}

// MusicKit leaves both of these undefined before it has a song open
function readSeconds(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(value ?? 0, 0) : 0;
}
