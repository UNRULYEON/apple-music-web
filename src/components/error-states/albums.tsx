import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { DiscAlbumIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function Albums() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={DiscAlbumIcon} />
        </EmptyMedia>
        <EmptyTitle>Couldn't load your albums</EmptyTitle>
        <EmptyDescription></EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
