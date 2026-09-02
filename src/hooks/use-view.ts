import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { HOME, readView, type View } from "@/lib/views/view";
import { useCanGoBack, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

export interface ViewNavigation {
  view: View;
  open: (view: View) => void;
  close: () => void;
  canClose: boolean;
}

export function useView(): ViewNavigation {
  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const isHydrated = useIsHydrated();
  const stored = useLocation({ select: (location) => readView(location.state.view) });

  const view = isHydrated ? (stored ?? HOME) : HOME;

  const open = useCallback(
    (next: View) => {
      void navigate({ to: ".", state: (previous) => ({ ...previous, view: next }) });
    },
    [navigate],
  );

  const close = useCallback(() => {
    if (canGoBack) {
      router.history.back();
      return;
    }

    void navigate({ to: ".", replace: true, state: (previous) => ({ ...previous, view: HOME }) });
  }, [canGoBack, navigate, router]);

  return { view, open, close, canClose: view.name !== "home" };
}
