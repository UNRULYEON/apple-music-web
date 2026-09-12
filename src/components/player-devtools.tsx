import { NOTICE_KEY } from "@/components/notification-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/hooks";
import { probeDrm, type DrmSupport } from "@/lib/music-kit/drm";
import type { Song } from "@/lib/music-kit/track";
import { askToNotify, isTabInFront, notifyPermission, notifySong } from "@/lib/player/notify";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

const UP_NEXT = 8;

export function PlayerDevtools({ theme }: { theme: "light" | "dark" }): React.ReactElement {
  const { queue, index, nowPlaying, upNext, isPlaying, isLoading, isShuffled, repeat } =
    usePlayer();
  const [drm, setDrm] = useState<DrmSupport[]>([]);

  useEffect(() => {
    void probeDrm().then(setDrm);
  }, []);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 overflow-auto bg-background p-4 font-sans text-foreground text-sm",
        theme === "dark" && "dark",
      )}
    >
      <Section title="Now playing">
        {nowPlaying ? (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{nowPlaying.name}</span>
            <span className="text-muted-foreground">{nowPlaying.artist?.name ?? "No artist"}</span>
            <Row label="id" value={nowPlaying.id} />
            <Row label="playId" value={nowPlaying.playId ?? "none, so the id above is used"} />
          </div>
        ) : (
          <span className="text-muted-foreground">Nothing in the player.</span>
        )}
      </Section>

      <Section title="State">
        <div className="flex flex-wrap gap-2">
          <Badge variant={isPlaying ? "success" : isLoading ? "info" : "warning"}>
            {isLoading ? "Loading" : isPlaying ? "Playing" : "Paused"}
          </Badge>
          <Badge variant={isShuffled ? "success" : "default"}>
            {isShuffled ? "Shuffle on" : "Shuffle off"}
          </Badge>
          <Badge variant={repeat === "off" ? "default" : "success"}>Repeat {repeat}</Badge>
        </div>
      </Section>

      <Section
        title={`Queue (${queue.length === 0 ? "empty" : `${index + 1} of ${queue.length}`})`}
      >
        {upNext.length === 0 ? (
          <span className="text-muted-foreground">Nothing after this song.</span>
        ) : (
          <ol className="flex flex-col gap-0.5 text-muted-foreground">
            {upNext.slice(0, UP_NEXT).map((song, position) => (
              <li key={`${song.id}-${position}`} className="truncate">
                {index + position + 2}. {song.name}
              </li>
            ))}
            {upNext.length > UP_NEXT && <li>and {upNext.length - UP_NEXT} more</li>}
          </ol>
        )}
      </Section>

      <Notifications song={nowPlaying} />

      <Section title="DRM">
        <div className="flex flex-col gap-1">
          {drm.map(({ keySystem, supported }) => (
            <div key={keySystem} className="flex items-center gap-2">
              <Badge variant={supported ? "success" : "error"}>{supported ? "Yes" : "No"}</Badge>
              <span className="text-muted-foreground">{keySystem}</span>
            </div>
          ))}
          {drm.length > 0 && drm.every(({ supported }) => !supported) && (
            <p className="text-muted-foreground text-xs">
              Full songs need DRM. Without it Apple Music takes the queue and then plays nothing.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}

const PERMISSION_BADGES: Record<
  string,
  { variant: "success" | "error" | "warning"; text: string }
> = {
  granted: { variant: "success", text: "Granted" },
  denied: { variant: "error", text: "Denied" },
  default: { variant: "warning", text: "Nobody has answered yet" },
  unsupported: { variant: "error", text: "This browser knows no notifications" },
};

function Notifications({ song }: { song?: Song }) {
  const [permission, setPermission] = useState(notifyPermission);
  const [isInFront, setInFront] = useState(isTabInFront);
  const [wasExplained, setExplained] = useState(() => localStorage.getItem(NOTICE_KEY) !== null);

  useEffect(() => {
    function watch() {
      setInFront(isTabInFront());
    }

    document.addEventListener("visibilitychange", watch);

    return () => document.removeEventListener("visibilitychange", watch);
  }, []);

  function ask() {
    void askToNotify().then(() => setPermission(notifyPermission()));
  }

  function forget() {
    localStorage.removeItem(NOTICE_KEY);
    setExplained(false);
  }

  const badge = PERMISSION_BADGES[permission] ?? PERMISSION_BADGES.unsupported;

  return (
    <Section title="Notifications">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant={badge?.variant}>{badge?.text}</Badge>
          <Badge variant={isInFront ? "warning" : "success"}>
            {isInFront ? "Tab in front, so a song change stays quiet" : "Tab behind, so it shows"}
          </Badge>
          <Badge variant={wasExplained ? "default" : "info"}>
            {wasExplained ? "The notice was shown" : "The notice waits"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => song && notifySong(song, { evenInFront: true })}
            disabled={!song || permission !== "granted"}
          >
            Show one now
          </Button>
          <Button size="xs" variant="outline" onClick={ask} disabled={permission !== "default"}>
            Ask the browser
          </Button>
          <Button size="xs" variant="outline" onClick={forget} disabled={!wasExplained}>
            Show the notice again
          </Button>
        </div>

        <p className="text-muted-foreground text-xs">
          A song change tells you only when the queue moves on by itself and this tab is behind
          another one.
        </p>
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs uppercase">{title}</span>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono">{value}</span>
    </div>
  );
}
