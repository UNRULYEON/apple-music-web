export const KEY_SYSTEMS = ["com.apple.fps", "com.widevine.alpha", "com.microsoft.playready"];

export interface DrmSupport {
  keySystem: string;
  supported: boolean;
}

export const NO_DRM_TITLE = "This browser cannot play music from Apple Music";

export const NO_DRM_DESCRIPTION =
  "To play music from Apple Music, a browser with DRM support is required. This browser does not support DRM. Please use a different browser that supports DRM.";

export class MissingDrmError extends Error {
  constructor() {
    super(NO_DRM_DESCRIPTION);
    this.name = "MissingDrmError";
  }
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
