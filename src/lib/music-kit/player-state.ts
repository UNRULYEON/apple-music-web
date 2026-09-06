import { getMusicKit } from "@/lib/music-kit/instance";
import { readSong, type Song } from "@/lib/music-kit/track";

const REPEAT_MODES = ["off", "queue", "song"] as const;

export type RepeatMode = (typeof REPEAT_MODES)[number];

export interface PlayerState {
  queue: Song[];
  index: number;
  nowPlaying?: Song;
  upNext: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  isShuffled: boolean;
  repeat: RepeatMode;
  canSkipNext: boolean;
  canSkipPrevious: boolean;
}

const QUEUE_EVENTS = ["queueItemsDidChange"] as const;
const STATE_EVENTS = [
  "playbackStateDidChange",
  "nowPlayingItemDidChange",
  "queuePositionDidChange",
  "shuffleModeDidChange",
  "repeatModeDidChange",
  "capabilitiesChanged",
] as const;

export const EMPTY_STATE: PlayerState = {
  queue: [],
  index: 0,
  upNext: [],
  isPlaying: false,
  isLoading: false,
  isShuffled: false,
  repeat: "off",
  canSkipNext: false,
  canSkipPrevious: false,
};

let state = EMPTY_STATE;
let songs: Song[] = [];
let instance: MusicKit.MusicKitInstance | undefined;
let listening = false;

const listeners = new Set<() => void>();

export function subscribeToPlayer(listener: () => void): () => void {
  listeners.add(listener);
  void listen();

  return () => {
    listeners.delete(listener);
  };
}

export function readPlayerState(): PlayerState {
  return state;
}

export function readInitialPlayerState(): PlayerState {
  return EMPTY_STATE;
}

export function nextRepeatMode(mode: RepeatMode): RepeatMode {
  return REPEAT_MODES[REPEAT_MODES.indexOf(mode) + 1] ?? "off";
}

export function toMusicKitRepeat(mode: RepeatMode): number {
  if (mode === "song") {
    return MusicKit.PlayerRepeatMode.one;
  }

  return mode === "queue" ? MusicKit.PlayerRepeatMode.all : MusicKit.PlayerRepeatMode.none;
}

// only for the tests, which need a store that forgets what an earlier test taught it
export function resetPlayerState(): void {
  state = EMPTY_STATE;
  songs = [];
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

  for (const event of QUEUE_EVENTS) {
    music.addEventListener(event, readQueue);
  }

  for (const event of STATE_EVENTS) {
    music.addEventListener(event, readPlayback);
  }

  readQueue();
}

function readQueue(): void {
  songs = (instance?.queue?.items ?? [])
    .map((item) => readSong(item))
    .filter((song): song is Song => song !== undefined);

  readPlayback();
}

function readPlayback(): void {
  const music = instance;

  if (!music) {
    return;
  }

  const index = Math.max(music.nowPlayingItemIndex, 0);
  const states = MusicKit.PlaybackStates;

  state = {
    queue: songs,
    index,
    nowPlaying: songs[index],
    upNext: songs.slice(index + 1),
    isPlaying: music.playbackState === states.playing,
    isLoading:
      music.playbackState === states.loading ||
      music.playbackState === states.waiting ||
      music.playbackState === states.stalled,
    isShuffled: music.shuffleMode !== MusicKit.PlayerShuffleMode.off,
    repeat: fromMusicKitRepeat(music.repeatMode),
    canSkipNext: music.capabilities?.canSkipToNextItem === true,
    canSkipPrevious: music.capabilities?.canSkipToPreviousItem === true,
  };

  for (const listener of listeners) {
    listener();
  }
}

function fromMusicKitRepeat(mode: number): RepeatMode {
  if (mode === MusicKit.PlayerRepeatMode.one) {
    return "song";
  }

  return mode === MusicKit.PlayerRepeatMode.all ? "queue" : "off";
}
