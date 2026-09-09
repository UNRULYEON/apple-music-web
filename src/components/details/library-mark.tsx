import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ReactNode } from "react";

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
    <Tooltip>
      {/* a span, not the default button, because a track row is itself a button */}
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
  );
}
