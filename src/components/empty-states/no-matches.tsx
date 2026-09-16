import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function NoMatches() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Search01Icon} strokeWidth={1.5} aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Nothing found</EmptyTitle>
        <EmptyDescription>No name or artist here matches what you typed.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
