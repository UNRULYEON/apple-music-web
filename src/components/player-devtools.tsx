import { Badge } from "@/components/ui/badge";
import { usePlayer } from "@/hooks";
import { probeDrm, type DrmSupport } from "@/lib/music-kit/drm";
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
