const SIX_MONTHS_IN_SECONDS = 15_777_000;

export interface SignOptions {
  teamId: string;
  keyId: string;
  privateKeyPem: string;
  issuedAt?: number;
  lifetimeInSeconds?: number;
}

export async function signDeveloperToken(options: SignOptions): Promise<string> {
  const issuedAt = options.issuedAt ?? Math.floor(Date.now() / 1000);
  const lifetime = options.lifetimeInSeconds ?? SIX_MONTHS_IN_SECONDS;

  if (lifetime > SIX_MONTHS_IN_SECONDS) {
    throw new Error(`Apple rejects a lifetime above ${SIX_MONTHS_IN_SECONDS} seconds.`);
  }

  const header = encodeJson({ alg: "ES256", kid: options.keyId });
  const payload = encodeJson({ iss: options.teamId, iat: issuedAt, exp: issuedAt + lifetime });
  const body = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    decodePem(options.privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  // Web Crypto returns the raw r||s pair, which is the format JOSE wants.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(body),
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

export function keyIdFromFileName(fileName: string): string | undefined {
  return /^AuthKey_([A-Z0-9]+)\.p8$/.exec(fileName)?.[1];
}

export function decodePem(pem: string): Uint8Array<ArrayBuffer> {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");

  if (!body) {
    throw new Error("The key file holds no PEM body. Use the .p8 file from Apple, unchanged.");
  }

  return Uint8Array.from(atob(body), (character) => character.charCodeAt(0));
}

function encodeJson(value: object): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
