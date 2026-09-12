import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NoArtists() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Mic01Icon} />
        </EmptyMedia>
        <EmptyTitle>No artists</EmptyTitle>
        <EmptyDescription>Add albums to your library to see their artists here.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
