const STORAGE_KEY = "sidebar-open";
const DESKTOP_QUERY = "(min-width: 800px)";
const SIDEBAR_WIDTH = 256;
const CLOSED_TOP = 40;

export function readStoredOpen(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function writeStoredOpen(open: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(open));
  } catch {}
}

export function clearPreHydrationState(): void {
  document.documentElement.removeAttribute("data-sidebar");
}

export const preHydrationScript = `try{
var m=!matchMedia(${JSON.stringify(DESKTOP_QUERY)}).matches;
if(m||localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="false"){
document.documentElement.setAttribute("data-sidebar",m?"closed-mobile":"closed")}
}catch(e){}`;

export { CLOSED_TOP, DESKTOP_QUERY, SIDEBAR_WIDTH };
