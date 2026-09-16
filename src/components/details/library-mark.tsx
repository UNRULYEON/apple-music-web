import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const INTENT_DELAY = 80;

export function LibraryMark({
  label,
  size = 14,
  children,
}: {
  label: string;
  size?: number;
  children?: ReactNode;
}) {
  return (
    <TooltipProvider delay={INTENT_DELAY}>
      <Tooltip>
        <TooltipTrigger render={<span />} className="inline-flex items-center gap-1">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={size}
            strokeWidth={2}
            aria-label={children ? undefined : label}
            aria-hidden={children ? true : undefined}
          />
          {children}
        </TooltipTrigger>
        <TooltipPopup>{label}</TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  );
}
