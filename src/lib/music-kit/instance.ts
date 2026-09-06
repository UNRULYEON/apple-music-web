import { getDeveloperToken } from "@/lib/music-kit/developer-token";
import { insistOnBrowser, withoutNodeMark } from "@/lib/music-kit/node-shim";

let instance: Promise<MusicKit.MusicKitInstance> | undefined;

export function getMusicKit(): Promise<MusicKit.MusicKitInstance> {
  instance ??= configure().catch((cause: unknown) => {
    instance = undefined;
    throw cause;
  });

  return instance;
}

async function configure(): Promise<MusicKit.MusicKitInstance> {
  await waitForScript();

  const developerToken = await getDeveloperToken();

  // MusicKit reads the runtime while it configures, and playback stays off if it sees
  // a process global, so it must not see one for that moment
  await withoutNodeMark(() =>
    MusicKit.configure({
      developerToken,
      app: { name: "Apple Music Web", build: "1.0.0" },
      // this app says what went wrong in its own words, so MusicKit must not
      // put its own dialog over the page
      suppressErrorDialog: true,
    }),
  );

  const music = MusicKit.getInstance();

  insistOnBrowser(music);

  return music;
}

function waitForScript(): Promise<void> {
  if (typeof window.MusicKit?.configure === "function") {
    return Promise.resolve();
  }

  return new Promise<void>(function listen(resolve) {
    document.addEventListener("musickitloaded", () => resolve(), { once: true });
  });
}
