import { createListeners } from "@/lib/listeners";
import { getMusicKit } from "@/lib/music-kit/instance";

export interface PlaybackTime {
  position: number;
  duration: number;
}

const TIME_EVENTS = [
  "playbackTimeDidChange",
  "playbackDurationDidChange",
  "nowPlayingItemDidChange",
] as const;

export const NO_TIME: PlaybackTime = { position: 0, duration: 0 };

const LANDED = 1.5;

let real = NO_TIME;
let shown = NO_TIME;

let held: number | undefined;

let instance: MusicKit.MusicKitInstance | undefined;
let listening = false;

const listeners = createListeners();

export function subscribeToPlaybackTime(listener: () => void): () => void {
  void listen();

  return listeners.subscribe(listener);
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

function show(): void {
  if (held !== undefined && real.position > 0 && Math.abs(real.position - held) < LANDED) {
    held = undefined;
  }

  const next = held === undefined ? real : { position: held, duration: real.duration };

  if (next.position === shown.position && next.duration === shown.duration) {
    return;
  }

  shown = next;

  listeners.notify();
}

function readSeconds(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(value ?? 0, 0) : 0;
}
