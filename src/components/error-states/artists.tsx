import { Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function Artists() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Mic01Icon} />
        </EmptyMedia>
        <EmptyTitle>Couldn't load your artists</EmptyTitle>
        <EmptyDescription></EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
