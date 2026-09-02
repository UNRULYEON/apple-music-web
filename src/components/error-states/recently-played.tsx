import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MusicNote02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function RecentlyPlayed() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={MusicNote02Icon} />
        </EmptyMedia>
        <EmptyTitle>Couldn't load recently played tracks</EmptyTitle>
        <EmptyDescription></EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
