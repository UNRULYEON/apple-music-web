import { useEffect, useState } from "react";
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
import { readNoticeShown, writeNoticeShown } from "@/lib/storage/notification-notice";

const TITLE = "Song notifications";

export function NotificationNotice() {
  const status = useAuthStatus();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (status !== "signed-in" || !canNotify() || isNotifyAnswered() || readNoticeShown()) {
      return;
    }

    setIsOpen(true);
  }, [status]);

  function accept() {
    writeNoticeShown();
    setIsOpen(false);
    void askToNotify();
  }

  function decline() {
    writeNoticeShown();
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
