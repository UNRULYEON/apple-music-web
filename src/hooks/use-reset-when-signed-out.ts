import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { removeStoredCache } from "@/integrations/tanstack-query/persister";
import { forgetStoredQueue } from "@/lib/storage/now-playing";
import { forgetStoredVolume } from "@/lib/storage/volume";
import { HOME } from "@/lib/views/view";
import { useAuthStatus } from "./use-auth-status";
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
