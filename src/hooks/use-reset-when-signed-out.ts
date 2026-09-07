import { useView } from "@/hooks/use-view";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { HOME } from "@/lib/views/view";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// the cache and the open view belong to the person who signed in, so both go away the
// moment the session ends. resetQueries() tells the views that show an answer to let it
// go, which clear() alone does not do, and clear() then drops what is left
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

    // "checking" is the status while the page starts, when the view that a person
    // reloaded on must stay
    if (status === "signed-out") {
      open(HOME);
    }
  }, [client, open, status]);
}
