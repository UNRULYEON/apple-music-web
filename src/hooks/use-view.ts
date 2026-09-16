import { useIsHydrated } from "@/hooks/use-is-hydrated";
import { startAtTop } from "@/lib/scroll-area";
import { HOME, isTopLevel, readView, viewKey, type View } from "@/lib/views/view";
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
