import { artworkUrl } from "@/lib/music-kit/resource";
import type { Song } from "@/lib/music-kit/track";

const ICON_SIZE = 128;
const IMAGE_SIZE = 512;
const TAG = "now-playing";

type SongNotification = NotificationOptions & { image?: string };

function api(): typeof Notification | undefined {
  return typeof Notification === "undefined" ? undefined : Notification;
}

export function canNotify(): boolean {
  return api() !== undefined;
}

export function isNotifyAnswered(): boolean {
  const notifications = api();

  return notifications !== undefined && notifications.permission !== "default";
}

export async function askToNotify(): Promise<boolean> {
  const notifications = api();

  if (!notifications) {
    return false;
  }

  if (notifications.permission !== "default") {
    return notifications.permission === "granted";
  }

  try {
    return (await notifications.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

export function isTabInFront(): boolean {
  return typeof document !== "undefined" && document.visibilityState === "visible";
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  return api()?.permission ?? "unsupported";
}

export function notifySong(song: Song, options: { evenInFront?: boolean } = {}): void {
  const notifications = api();

  if (!notifications || notifications.permission !== "granted") {
    return;
  }

  if (isTabInFront() && options.evenInFront !== true) {
    return;
  }

  const art = song.artwork;
  const details: SongNotification = {
    body: song.artist?.name,
    icon: art ? artworkUrl(art, ICON_SIZE) : undefined,
    image: art ? artworkUrl(art, IMAGE_SIZE) : undefined,
    tag: TAG,
    silent: true,
  };

  try {
    const notice = new notifications(song.name, details);

    notice.addEventListener("click", () => {
      globalThis.focus();
      notice.close();
    });
  } catch {
    return;
  }
}
