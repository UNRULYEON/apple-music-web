import { useSyncExternalStore } from "react";
import {
  type AuthStatus,
  readAuthStatus,
  readInitialAuthStatus,
  subscribeToAuthStatus,
} from "@/lib/music-kit/auth";

export function useAuthStatus(): AuthStatus {
  return useSyncExternalStore(subscribeToAuthStatus, readAuthStatus, readInitialAuthStatus);
}
