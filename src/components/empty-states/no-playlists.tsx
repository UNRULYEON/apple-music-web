import { Playlist01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function NoPlaylists() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Playlist01Icon} strokeWidth={1.5} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No playlists</EmptyTitle>
        <EmptyDescription>Make a playlist to see it here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
