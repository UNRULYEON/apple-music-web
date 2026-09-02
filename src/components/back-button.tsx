import { Button } from "@/components/ui/button";
import { useView } from "@/hooks";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Separator } from "@/components/ui/separator";

export function BackButton() {
  const { canClose, close } = useView();

  if (!canClose) {
    return null;
  }

  return (
    <>
      <Separator orientation="vertical" className="my-2" />
      <Button aria-label="Back" onClick={close} size="icon" variant="ghost">
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
      </Button>
    </>
  );
}
