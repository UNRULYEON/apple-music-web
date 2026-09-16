import { useContext, useEffect } from "react";
import { BackdropContext } from "@/contexts";

export function useBackdrop(colors: string[] | undefined): void {
  const setColors = useContext(BackdropContext);

  if (!setColors) {
    throw new Error("useBackdrop must be used within a BackdropProvider");
  }

  useEffect(() => {
    setColors(colors);

    return () => setColors(undefined);
  }, [colors, setColors]);
}
