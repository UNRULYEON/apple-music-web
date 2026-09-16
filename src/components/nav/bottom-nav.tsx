import { LaptopIcon, LogoutSquare01Icon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ShortcutsDialog } from "@/components";
import { Button } from "@/components/ui/button";
import { RadioGroupPrimitive, RadioPrimitive } from "@/components/ui/radio-group";
import { useTheme } from "@/hooks";
import { signOut } from "@/lib/music-kit/auth";
import {
  segmentedControlItemVariants,
  segmentedControlRootClassName,
} from "@/lib/segmented-control";
import type { Theme } from "@/lib/storage/theme";
import { cn } from "@/lib/utils";

const itemClassName = segmentedControlItemVariants({
  className: "grow",
  size: "sm",
  state: "checked",
});

export function BottomNav() {
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function startSignOut(): Promise<void> {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <RadioGroupPrimitive
        aria-label="Theme picker"
        className={cn(segmentedControlRootClassName, "w-full")}
        value={theme}
        onValueChange={(value) => setTheme(value as Theme)}
      >
        <RadioPrimitive.Root className={itemClassName} value="light" aria-label="Light">
          <HugeiconsIcon icon={Sun03Icon} strokeWidth={2} aria-hidden="true" />
        </RadioPrimitive.Root>
        <RadioPrimitive.Root className={itemClassName} value="dark" aria-label="Dark">
          <HugeiconsIcon icon={Moon02Icon} strokeWidth={2} aria-hidden="true" />
        </RadioPrimitive.Root>
        <RadioPrimitive.Root className={itemClassName} value="system" aria-label="System">
          <HugeiconsIcon icon={LaptopIcon} strokeWidth={2} aria-hidden="true" />
        </RadioPrimitive.Root>
      </RadioGroupPrimitive>

      <ShortcutsDialog />

      <Button
        variant="ghost"
        className="justify-start"
        loading={isSigningOut}
        onClick={startSignOut}
      >
        <HugeiconsIcon icon={LogoutSquare01Icon} strokeWidth={2} aria-hidden="true" />
        Log out
      </Button>
    </div>
  );
}
