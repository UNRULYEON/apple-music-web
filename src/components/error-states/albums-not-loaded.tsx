import { DiscAlbumIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function AlbumsNotLoaded() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={DiscAlbumIcon} strokeWidth={1.5} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Couldn't load your albums</EmptyTitle>
        <EmptyDescription>Check your connection and try again.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
