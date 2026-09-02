import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NoRecentlyPlayed() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={MusicNote02Icon} />
        </EmptyMedia>
        <EmptyTitle>No recently played</EmptyTitle>
        <EmptyDescription>
          Play some music to see your recently played tracks here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
