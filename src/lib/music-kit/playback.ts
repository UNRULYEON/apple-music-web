import type { AlbumType } from "@/lib/music-kit/album";
import { hasDrm, MissingDrmError } from "@/lib/music-kit/drm";
import { getMusicKit } from "@/lib/music-kit/instance";
import { toMusicKitRepeat, type RepeatMode } from "@/lib/music-kit/player-state";
import { readItems } from "@/lib/music-kit/resource";
import { fetchStorefront } from "@/lib/music-kit/storefront";
import type { PlaylistType } from "@/lib/music-kit/playlists";
import type { Song } from "@/lib/music-kit/track";

export interface QueueSource {
  type: AlbumType | PlaylistType;
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

// what Apple calls the error tells a person more than the message behind it
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

  // MusicKit starts a shuffled queue at the song it was given, so a shuffle that nobody
  // pointed at a song starts at a random one
  const startWith =
    options.startAt ?? (options.shuffle ? Math.floor(Math.random() * ids.length) : 0);

  await music.setQueue({
    songs: ids,
    startWith,
    startPlaying: true,
    shuffleMode: options.shuffle
      ? MusicKit.PlayerShuffleMode.songs
      : MusicKit.PlayerShuffleMode.off,
  });

  if (music.queueIsEmpty) {
    const [id] = ids;

    throw new Error(`Apple Music kept no song for the id ${id}. ${await askTheCatalog(id ?? "")}`);
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

// the queue a person left behind is built again the way it was built the first time,
// only without a song starting. Nothing is played, so this asks for no DRM.
export async function queueWithoutPlaying(songs: string[], startAt: number): Promise<void> {
  const music = await getMusicKit();

  await music.setQueue({ songs, startWith: startAt, startPlaying: false });
}

export async function resumePlayback(): Promise<void> {
  await requireDrm();

  const music = await getMusicKit();

  // MusicKit turns a second play() down, so only ask when it is not playing already
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

export async function stopPlayback(): Promise<void> {
  const music = await getMusicKit();

  music.stop();
}

// jumping straight to a position drops whatever is loading, so a second tap never
// waits for the song a first tap started. The stop first is what lets the song being
// left behind take its key session down cleanly, instead of FairPlay finding it gone.
// the player belongs to the person who signed in: the sound stops, the queue goes, and
// the way it was being played goes back to where it started
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

// a key or DRM session that broke leaves the player unable to start anything at all,
// so it needs the queue built again rather than a word to the person
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

// MusicKit asks itself to play while it is still starting a song, then leaves the
// refusal to nobody. It happens on a quick skip and nothing is wrong, so this keeps
// that one complaint out of the console and lets every other one through.
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

// the queue came back empty, so find out what the catalog says about the song itself
async function askTheCatalog(id: string): Promise<string> {
  try {
    const storefront = await fetchStorefront();
    const music = await getMusicKit();
    const { data } = await music.api.music(`/v1/catalog/${storefront.id}/songs/${id}`);
    const [first] = readItems(data);
    const attributes = (first as { attributes?: Record<string, unknown> } | undefined)?.attributes;

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
