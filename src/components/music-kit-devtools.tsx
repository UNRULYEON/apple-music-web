import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/lib/confetti";
import { useAuthStatus } from "@/lib/music-kit/auth";
import {
  dropToken,
  forgetSession,
  keepSession,
  readSavedAt,
  restoreToken,
} from "@/lib/music-kit/dev-session";
import { cn } from "@/lib/utils";

export function MusicKitDevtools({ theme }: { theme: "light" | "dark" }) {
  const status = useAuthStatus();
  const [savedAt, setSavedAt] = useState<string>();

  useEffect(() => {
    if (status === "signed-in") {
      void keepSession().then(() => setSavedAt(readSavedAt()));
    } else {
      setSavedAt(readSavedAt());
    }
  }, [status]);

  function forget(): void {
    forgetSession();
    setSavedAt(undefined);
    void dropToken();
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 bg-background p-4 font-sans text-sm text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Apple Music</span>
          <Badge variant={status === "signed-in" ? "success" : "error"}>
            {status === "signed-in" ? "Signed in" : "Signed out"}
          </Badge>
          <Badge variant={savedAt ? "success" : "error"}>
            {savedAt && "Session in local storage"}
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={status !== "signed-in"}
          onClick={() => void dropToken()}
          size="sm"
          variant="outline"
        >
          Sign out
        </Button>
        <Button
          disabled={!savedAt || status === "signed-in"}
          onClick={() => void restoreToken()}
          size="sm"
          variant="outline"
        >
          Sign in
        </Button>
        <Button
          disabled={!savedAt && status !== "signed-in"}
          onClick={forget}
          size="sm"
          variant="destructive-outline"
        >
          Sign out and remove from local storage
        </Button>
        <Button onClick={fireConfetti} size="sm" variant="outline">
          Fire confetti
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          {savedAt
            ? `Session in local storage from ${new Date(savedAt).toLocaleString()}.`
            : "No session in local storage. Sign in once to store it."}
        </p>
      </div>
    </div>
  );
}
