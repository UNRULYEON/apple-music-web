import { getDeveloperToken } from "@/lib/music-kit/developer-token";

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

  await MusicKit.configure({
    developerToken: await getDeveloperToken(),
    app: { name: "Apple Music Web", build: "1.0.0" },
  });

  return MusicKit.getInstance();
}

function waitForScript(): Promise<void> {
  if (typeof window.MusicKit?.configure === "function") {
    return Promise.resolve();
  }

  return new Promise<void>(function listen(resolve) {
    document.addEventListener("musickitloaded", () => resolve(), { once: true });
  });
}
