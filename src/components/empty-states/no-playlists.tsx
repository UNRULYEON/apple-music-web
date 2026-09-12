import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { PlayListIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NoPlaylists() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={PlayListIcon} />
        </EmptyMedia>
        <EmptyTitle>No playlists</EmptyTitle>
        <EmptyDescription>Make a playlist to see it here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
