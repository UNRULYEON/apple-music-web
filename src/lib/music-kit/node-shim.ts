// MusicKit turns playback off when it believes it runs in Node. It asks twice, and the
// two questions differ: the base64 helpers read process.versions.node as the script
// loads, while the runtime that gates setQueue only asks whether process exists at all.
// A bundler that puts a process shim in the browser answers yes to both, so the API
// keeps working while setQueue quietly keeps nothing.

// MusicKit reads its own flags from local storage as its scripts load, so this asks
// for the next song to be fetched early. The name is Apple's and is not documented;
// take the second line away and skips simply go back to the normal speed.
export const preHydrationScript = `try{
var p=globalThis.process;
if(p&&p.versions&&p.versions.node!==undefined){delete p.versions.node}
localStorage.setItem("mk-hlsjs-item-preloading","1")
}catch(e){}`;

// how many turns of the microtask queue the runtime check is given. Nothing else can
// run in them, not even a script MusicKit fetches, so nothing else sees the shim gone.
const TURNS = 30;

// MusicKit reads the runtime in the first turns of configuring. The shim is out of
// sight for those turns only: holding it back any longer lets other scripts of
// MusicKit start while process is missing, and their own code then breaks on it.
export async function withoutNodeMark<T>(run: () => Promise<T>): Promise<T> {
  const shim = Reflect.get(globalThis, "process") as unknown;

  if (shim === undefined) {
    return run();
  }

  Reflect.deleteProperty(globalThis, "process");

  const running = run();

  try {
    for (let turn = 0; turn < TURNS; turn++) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.resolve();
    }
  } finally {
    Reflect.set(globalThis, "process", shim);
  }

  return running;
}

// the runtime check may have taken longer than the turns above, and a MusicKit that
// believes it runs in Node plays nothing at all, so this says otherwise to its face
export function insistOnBrowser(music: MusicKit.MusicKitInstance): void {
  const services = Reflect.get(music, "_services") as
    | { runtime?: { config?: { isNodeEnvironment?: boolean } } }
    | undefined;
  const config = services?.runtime?.config;

  if (config?.isNodeEnvironment === true) {
    config.isNodeEnvironment = false;
  }
}
