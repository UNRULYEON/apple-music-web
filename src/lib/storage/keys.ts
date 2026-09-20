const PREFIX = "apple-music-web";

export const STORAGE_KEYS = {
  cache: `${PREFIX}.cache`,
  demoMode: `${PREFIX}.demo-mode`,
  devtools: `${PREFIX}.devtools`,
  devtoolsToken: `${PREFIX}.devtools-token`,
  notificationNotice: `${PREFIX}.notification-notice`,
  nowPlaying: `${PREFIX}.now-playing`,
  sidebarOpen: `${PREFIX}.sidebar-open`,
  theme: `${PREFIX}.theme`,
  volume: `${PREFIX}.volume`,
} as const;

const LEGACY_KEYS: Record<string, string> = {
  "demo-mode": STORAGE_KEYS.demoMode,
  "music-kit-devtools.saved-token": STORAGE_KEYS.devtoolsToken,
  "notification-notice": STORAGE_KEYS.notificationNotice,
  "now-playing": STORAGE_KEYS.nowPlaying,
  "sidebar-open": STORAGE_KEYS.sidebarOpen,
  theme: STORAGE_KEYS.theme,
  volume: STORAGE_KEYS.volume,
};

export const MIGRATION_SCRIPT = `try{
var k=${JSON.stringify(LEGACY_KEYS)};
for(var o in k){var v=localStorage.getItem(o);
if(v!==null){if(localStorage.getItem(k[o])===null){localStorage.setItem(k[o],v)}localStorage.removeItem(o)}}
}catch(e){}`;
