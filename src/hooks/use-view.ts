import { useCanGoBack, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { startAtTop } from "@/lib/scroll-area";
import { HOME, isTopLevel, readView, type View, viewKey } from "@/lib/views/view";
import { useIsHydrated } from "./use-is-hydrated";

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

  const key = viewKey(view);

  const open = useCallback(
    (next: View) => {
      if (viewKey(next) === key) {
        startAtTop();
        return;
      }

      void navigate({
        to: ".",
        replace: isTopLevel(next),
        state: (previous) => ({ ...previous, view: next }),
      });
    },
    [key, navigate],
  );

  const close = useCallback(() => {
    if (canGoBack) {
      router.history.back();
      return;
    }

    void navigate({ to: ".", replace: true, state: (previous) => ({ ...previous, view: HOME }) });
  }, [canGoBack, navigate, router]);

  return { view, open, close, canClose: !isTopLevel(view) };
}
