import { BREAKPOINTS } from "@/lib/layout";
import { readStorage, writeStorage } from "@/lib/storage/local";

const STORAGE_KEY = "sidebar-open";
const DESKTOP_QUERY = `(min-width: ${BREAKPOINTS.md}px)`;

export function readStoredOpen(): boolean {
  return readStorage(STORAGE_KEY) !== "false";
}

export function writeStoredOpen(open: boolean): void {
  writeStorage(STORAGE_KEY, String(open));
}

export function clearPreHydrationState(): void {
  document.documentElement.removeAttribute("data-sidebar");
}

export const PRE_HYDRATION_SCRIPT = `try{
var m=!matchMedia(${JSON.stringify(DESKTOP_QUERY)}).matches;
if(m||localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="false"){
document.documentElement.setAttribute("data-sidebar",m?"closed-mobile":"closed")}
}catch(e){}`;
