import { useContext } from "react";
import { PlayerContext, type PlayerContextType } from "@/contexts";

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }

  return context;
}
