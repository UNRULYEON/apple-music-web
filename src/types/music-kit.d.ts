declare namespace MusicKit {
  interface MediaItem {
    id: string;
    attributes?: Record<string, unknown>;
  }

  interface Queue {
    items: MediaItem[];
    length: number;
    isEmpty: boolean;
    position: number;
  }

  interface QueueOptions {
    songs?: string[];
    album?: string;
    playlist?: string;
    startWith?: number;
    startPlaying?: boolean;
    startTime?: number;
    shuffleMode?: number;
    repeatMode?: number;
  }

  interface PlaybackStateEvent {
    oldState: number;
    state: number;
  }

  interface MediaError {
    name?: string;
    message?: string;
  }

  interface MediaErrorEvent {
    error?: MediaError;
  }

  interface EventMap {
    playbackStateDidChange: PlaybackStateEvent;
    nowPlayingItemDidChange: { item?: MediaItem };
    queueItemsDidChange: MediaItem[];
    queuePositionDidChange: { position: number };
    shuffleModeDidChange: number;
    repeatModeDidChange: number;
    capabilitiesChanged: void;
    mediaPlaybackError: MediaErrorEvent & MediaError;
    playbackSessionError: MediaErrorEvent & MediaError;
  }

  interface Capabilities {
    canPause: boolean;
    canSeek: boolean;
    canSetRepeatMode: boolean;
    canSetShuffleMode: boolean;
    canSkipToNextItem: boolean;
    canSkipToPreviousItem: boolean;
  }

  interface MusicKitInstance {
    capabilities: Capabilities;
    isAuthorized: boolean;
    musicUserToken: string;
    playbackState: number;
    isPlaying: boolean;
    queue?: Queue;
    queueIsEmpty: boolean;
    nowPlayingItem?: MediaItem;
    nowPlayingItemIndex: number;
    shuffleMode: number;
    repeatMode: number;
    authorize(): Promise<string>;
    unauthorize(): Promise<void>;
    setQueue(options: QueueOptions): Promise<Queue | undefined>;
    playNext(options: QueueOptions): Promise<void>;
    playLater(options: QueueOptions): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    seekToTime(time: number): Promise<void>;
    skipToNextItem(): Promise<void>;
    skipToPreviousItem(): Promise<void>;
    changeToMediaAtIndex(index: number): Promise<void>;
    addEventListener<K extends keyof EventMap>(
      name: K,
      callback: (event: EventMap[K]) => void,
    ): void;
    removeEventListener<K extends keyof EventMap>(
      name: K,
      callback: (event: EventMap[K]) => void,
    ): void;
    api: {
      music(path: string, query?: Record<string, unknown>): Promise<{ data: unknown }>;
    };
  }

  const PlaybackStates: {
    none: number;
    loading: number;
    playing: number;
    paused: number;
    stopped: number;
    ended: number;
    seeking: number;
    waiting: number;
    stalled: number;
    completed: number;
  };

  const PlayerRepeatMode: { none: number; one: number; all: number };
  const PlayerShuffleMode: { off: number; songs: number };

  function configure(options: {
    developerToken: string;
    app: { name: string; build: string };
    suppressErrorDialog?: boolean;
  }): Promise<MusicKitInstance>;

  function getInstance(): MusicKitInstance;
}

interface Window {
  MusicKit?: typeof MusicKit;
}
