import { DiscAlbumIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function NoAlbums() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={DiscAlbumIcon} />
        </EmptyMedia>
        <EmptyTitle>No albums</EmptyTitle>
        <EmptyDescription>Add albums to your library to see them here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
