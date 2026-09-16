import { useHotkey } from "@tanstack/react-hotkeys";
import { useQueryClient } from "@tanstack/react-query";
import { toastManager } from "@/components/ui/toast";
import { isDemoSource } from "@/lib/demo/library";
import { DEMO_QUERY_KEY, readDemoMode, setDemoMode } from "@/lib/demo/mode";
import { DEMO_MODE_HOTKEY } from "@/lib/hotkeys";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { usePlayer } from "./use-player";

const TOAST_ID = "demo-mode";

export function useDemoModeHotkey(): void {
  const status = useAuthStatus();
  const client = useQueryClient();
  const { nowPlaying, source, close } = usePlayer();

  useHotkey(
    DEMO_MODE_HOTKEY,
    () => {
      const isOn = !readDemoMode();

      setDemoMode(isOn);

      if (isOn && nowPlaying && !isDemoSource(source)) {
        close();
      }

      client.removeQueries({ queryKey: DEMO_QUERY_KEY });
      void client.invalidateQueries({ refetchType: "none" });

      toastManager.add({
        id: TOAST_ID,
        title: isOn ? "Demo mode is on" : "Demo mode is off",
        description: isOn
          ? "Your library shows the demo albums and playlists."
          : "Your library shows your own music again.",
      });
    },
    { enabled: status === "signed-in", requireReset: true },
  );
}
