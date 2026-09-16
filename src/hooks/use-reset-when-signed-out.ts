import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { removeStoredCache } from "@/integrations/tanstack-query/persister";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { forgetStoredQueue } from "@/lib/now-playing-storage";
import { HOME } from "@/lib/views/view";
import { forgetStoredVolume } from "@/lib/volume-storage";
import { useView } from "./use-view";

export function useResetWhenSignedOut(): void {
  const status = useAuthStatus();
  const client = useQueryClient();
  const { open } = useView();

  useEffect(() => {
    if (status === "signed-in") {
      return;
    }

    void client.resetQueries();
    client.clear();

    if (status === "signed-out") {
      removeStoredCache();
      forgetStoredVolume();
      forgetStoredQueue();
      open(HOME);
    }
  }, [client, open, status]);
}
