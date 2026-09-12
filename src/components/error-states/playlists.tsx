import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PlayListIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function Playlists() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={PlayListIcon} />
        </EmptyMedia>
        <EmptyTitle>Couldn't load your playlists</EmptyTitle>
        <EmptyDescription></EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
