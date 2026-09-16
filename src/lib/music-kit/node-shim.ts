export const preHydrationScript = `try{
var p=globalThis.process;
if(p&&p.versions&&p.versions.node!==undefined){delete p.versions.node}
localStorage.setItem("mk-hlsjs-item-preloading","1")
}catch(e){}`;

const TURNS = 30;

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

export function insistOnBrowser(music: MusicKit.MusicKitInstance): void {
  const services = Reflect.get(music, "_services") as
    | { runtime?: { config?: { isNodeEnvironment?: boolean } } }
    | undefined;
  const config = services?.runtime?.config;

  if (config?.isNodeEnvironment === true) {
    config.isNodeEnvironment = false;
  }
}
