import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { askToNotify, canNotify, isNotifyAnswered } from "@/lib/player/notify";
import { useEffect, useState } from "react";

export const NOTICE_KEY = "notification-notice";
const TITLE = "Song notifications";

function wasShown(): boolean {
  try {
    return localStorage.getItem(NOTICE_KEY) !== null;
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(NOTICE_KEY, "shown");
  } catch {
    return;
  }
}

export function NotificationNotice(): React.ReactElement {
  const status = useAuthStatus();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status !== "signed-in" || !canNotify() || isNotifyAnswered() || wasShown()) {
      return;
    }

    setIsOpen(true);
  }, [status]);

  function accept() {
    remember();
    setIsOpen(false);
    void askToNotify();
  }

  function decline() {
    remember();
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogPopup showCloseButton={false} bottomStickOnMobile>
        <DialogHeader>
          <DialogTitle>{TITLE}</DialogTitle>
          <DialogDescription>
            This app can show you a notification each time the queue moves on. Your browser asks you
            next whether it may. Nothing plays differently if you say no.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={decline}>
            Not now
          </Button>
          <Button onClick={accept}>Next</Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
