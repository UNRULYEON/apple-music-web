// Apple Music plays full songs behind DRM. Safari uses FairPlay, the others Widevine.
export const KEY_SYSTEMS = ["com.apple.fps", "com.widevine.alpha", "com.microsoft.playready"];

export interface DrmSupport {
  keySystem: string;
  supported: boolean;
}

const CONFIGURATION: MediaKeySystemConfiguration[] = [
  {
    initDataTypes: ["cenc"],
    audioCapabilities: [{ contentType: 'audio/mp4;codecs="mp4a.40.2"' }],
  },
];

export async function hasDrm(): Promise<boolean> {
  for (const keySystem of KEY_SYSTEMS) {
    // oxlint-disable-next-line no-await-in-loop
    if (await supports(keySystem)) {
      return true;
    }
  }

  return false;
}

export async function probeDrm(): Promise<DrmSupport[]> {
  return Promise.all(
    KEY_SYSTEMS.map(async (keySystem) => ({ keySystem, supported: await supports(keySystem) })),
  );
}

async function supports(keySystem: string): Promise<boolean> {
  if (typeof navigator?.requestMediaKeySystemAccess !== "function") {
    return false;
  }

  try {
    await navigator.requestMediaKeySystemAccess(keySystem, CONFIGURATION);

    return true;
  } catch {
    return false;
  }
}
