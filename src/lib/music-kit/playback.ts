import { isRecord } from "@/lib/is-record";
import type { AlbumType } from "@/lib/music-kit/album";
import { catalogPath } from "@/lib/music-kit/api";
import { hasDrm, MissingDrmError } from "@/lib/music-kit/drm";
import { getMusicKit } from "@/lib/music-kit/instance";
import { type RepeatMode, toMusicKitRepeat } from "@/lib/music-kit/player-state";
import type { PlaylistType } from "@/lib/music-kit/playlists";
import { readItems } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import type { Song } from "@/lib/music-kit/track";

export interface QueueSource {
  type: AlbumType | PlaylistType | "artists";
  id: string;
}

export interface PlayOptions {
  startAt?: number;
  shuffle?: boolean;
  from?: QueueSource;
}

export function isSameSource(one?: QueueSource, other?: QueueSource): boolean {
  return one !== undefined && other !== undefined && one.type === other.type && one.id === other.id;
}

const ERROR_REASONS: Record<string, string> = {
  ACCESS_DENIED: "Apple Music does not give this app access to that song.",
  AGE_VERIFICATION: "Apple Music wants an age check for that song.",
  AUTHORIZATION_ERROR: "Apple Music turned the sign in down. Sign in again.",
  CONFIGURATION_ERROR: "This app is set up wrongly for Apple Music.",
  CONTENT_EQUIVALENT: "That song has another form in this country.",
  CONTENT_RESTRICTED: "That song is held back in this country.",
  CONTENT_UNAVAILABLE: "Apple Music does not have that song here.",
  CONTENT_UNSUPPORTED: "This browser cannot play that song.",
  DEVICE_LIMIT: "This account has too many devices.",
  MEDIA_CERTIFICATE: "This browser could not take the Apple Music certificate.",
  MEDIA_KEY: "This browser could not make the key that unlocks the song.",
  MEDIA_LICENSE: "Apple Music gave no licence for that song.",
  MEDIA_SESSION: "This browser could not open a DRM session.",
  NETWORK_ERROR: "The network stopped the song.",
  QUOTA_EXCEEDED: "This app has asked Apple Music too many times today.",
  SERVICE_UNAVAILABLE: "Apple Music is not answering.",
  STREAM_UPSELL: "This account plays somewhere else at the moment.",
  SUBSCRIPTION_ERROR: "This Apple Music account has no subscription that plays songs.",
  TOKEN_EXPIRED: "The sign in ran out. Sign in again.",
  UNAUTHORIZED_ERROR: "Apple Music turned the token of this app down.",
  USER_INTERACTION_REQUIRED: "A browser plays sound only after a person asks for it.",
  WIDEVINE_CDM_EXPIRED: "The DRM part of this browser is too old for Apple Music.",
};

export function describeError(error?: MusicKit.MediaError): string {
  const name = error?.name;
  const reason = name ? ERROR_REASONS[name] : undefined;

  if (reason) {
    return `${reason} (${name})`;
  }

  return error?.message ?? name ?? "Apple Music gave no reason.";
}

async function requireDrm(): Promise<void> {
  if (!(await hasDrm())) {
    throw new MissingDrmError();
  }
}

export async function playSongs(songs: Song[], options: PlayOptions = {}): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();
  const ids = songs.map((song) => song.playId ?? song.id);

  if (ids.length === 0) {
    return;
  }

  const startWith =
    options.startAt ?? (options.shuffle ? Math.floor(Math.random() * ids.length) : 0);

  await queueSongs(
    music,
    ids,
    ids[startWith] ?? "",
    options.shuffle ? MusicKit.PlayerShuffleMode.songs : MusicKit.PlayerShuffleMode.off,
  );

  if (music.queueIsEmpty) {
    const [id] = ids;

    throw new Error(`Apple Music kept no song for the id ${id}. ${await askTheCatalog(id ?? "")}`);
  }
}

const UNRESOLVED = /could not be resolved:\s*(?<ids>.+)/i;

async function queueSongs(
  music: MusicKit.MusicKitInstance,
  ids: string[],
  startId: string,
  shuffleMode: number,
): Promise<void> {
  try {
    await music.setQueue({
      songs: ids,
      startWith: Math.max(ids.indexOf(startId), 0),
      startPlaying: true,
      shuffleMode,
    });
  } catch (cause) {
    const refused = readRefusedIds(cause);
    const left = ids.filter((id) => !refused.has(id));

    if (left.length === 0 || left.length === ids.length) {
      throw cause;
    }

    if (refused.has(startId)) {
      throw new Error("Apple Music does not have that song here.", { cause });
    }

    await queueSongs(music, left, startId, shuffleMode);
  }
}

function readRefusedIds(cause: unknown): Set<string> {
  const found = UNRESOLVED.exec(readMessage(cause));
  const ids = found?.groups?.ids;

  return new Set(ids ? ids.split(",").map((id) => id.trim()) : []);
}

function readMessage(cause: unknown): string {
  if (!isRecord(cause)) {
    return "";
  }

  const { message } = cause;

  return typeof message === "string" ? message : "";
}

export async function playStation(id: string): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();

  await music.setQueue({ station: id, startPlaying: true });

  if (music.queueIsEmpty) {
    throw new Error(`Apple Music kept no song for the station ${id}.`);
  }
}

export async function queueNext(songs: Song[]): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();

  await music.playNext({ songs: songs.map((song) => song.playId ?? song.id) });
}

export async function queueLast(songs: Song[]): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();

  await music.playLater({ songs: songs.map((song) => song.playId ?? song.id) });
}

export async function queueWithoutPlaying(songs: string[], startAt: number): Promise<void> {
  const music = await getMusicKit();

  await music.setQueue({ songs, startWith: startAt, startPlaying: false });
}

export async function resumePlayback(): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();

  if (music.isPlaying) {
    return;
  }

  await music.play();
}

export async function pausePlayback(): Promise<void> {
  const music = await getMusicKit();

  music.pause();
}

export async function seekTo(seconds: number): Promise<void> {
  const music = await getMusicKit();

  await music.seekToTime(seconds);
}

export async function clearPlayback(): Promise<void> {
  const music = await getMusicKit();

  music.stop();
  music.shuffleMode = MusicKit.PlayerShuffleMode.off;
  music.repeatMode = toMusicKitRepeat("off");

  await music.clearQueue();
}

export async function changeToIndex(index: number): Promise<void> {
  const music = await getMusicKit();

  music.stop();

  await music.changeToMediaAtIndex(index);
}

export async function setShuffleMode(shuffle: boolean): Promise<void> {
  const music = await getMusicKit();

  music.shuffleMode = shuffle ? MusicKit.PlayerShuffleMode.songs : MusicKit.PlayerShuffleMode.off;
}

export async function setRepeatMode(mode: RepeatMode): Promise<void> {
  const music = await getMusicKit();

  music.repeatMode = toMusicKitRepeat(mode);
}

const BROKEN_SESSION = new Set(["MEDIA_KEY", "MEDIA_SESSION", "MEDIA_LICENSE"]);

export async function subscribeToPlaybackErrors(listeners: {
  onError: (message: string) => void;
  onSessionBroken: () => void;
}): Promise<() => void> {
  const music = await getMusicKit();

  function handle(event: MusicKit.MediaErrorEvent & MusicKit.MediaError): void {
    const error = event.error ?? event;

    if (error.name !== undefined && BROKEN_SESSION.has(error.name)) {
      listeners.onSessionBroken();
      return;
    }

    listeners.onError(describeError(error));
  }

  music.addEventListener("mediaPlaybackError", handle);
  music.addEventListener("playbackSessionError", handle);

  return () => {
    music.removeEventListener("mediaPlaybackError", handle);
    music.removeEventListener("playbackSessionError", handle);
  };
}

const KNOWN_COMPLAINT = "play() method was called without";

export function silenceKnownRejections(): () => void {
  function handle(event: PromiseRejectionEvent): void {
    const reason: unknown = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);

    if (message.includes(KNOWN_COMPLAINT)) {
      event.preventDefault();
    }
  }

  globalThis.addEventListener("unhandledrejection", handle);

  return () => globalThis.removeEventListener("unhandledrejection", handle);
}

async function askTheCatalog(id: string): Promise<string> {
  try {
    const storefront = await fetchStorefront();
    const path = await catalogPath("songs", id);
    const music = await getMusicKit();
    const { data } = await music.api.music(path);
    const [first] = readItems(data);
    const attributes = isRecord(first) && isRecord(first.attributes) ? first.attributes : undefined;

    if (!attributes) {
      return `The ${storefront.id} catalog holds no song with that id.`;
    }

    const name = typeof attributes.name === "string" ? attributes.name : "a song";
    const playable = attributes.playParams ? "and gives play parameters" : "but gives none";

    return `The ${storefront.id} catalog holds it as "${name}" ${playable}.`;
  } catch (cause) {
    return `Asking the catalog about it failed: ${cause instanceof Error ? cause.message : "no reason given"}.`;
  }
}
