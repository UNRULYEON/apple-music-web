import { describe, expect, it } from "vitest";
import { decodePem, keyIdFromFileName, signDeveloperToken } from "./sign.ts";

async function makeTestKeyPem(): Promise<{ pem: string; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  let binary = "";

  for (const byte of pkcs8) {
    binary += String.fromCharCode(byte);
  }

  const body = btoa(binary).replace(/(.{64})/g, "$1\n");

  return {
    pem: `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`,
    publicKey: pair.publicKey,
  };
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(atob(segment.replaceAll("-", "+").replaceAll("_", "/")));
}

describe("signDeveloperToken", () => {
  it("makes a token Apple can verify", async () => {
    const { pem, publicKey } = await makeTestKeyPem();
    const issuedAt = 1_700_000_000;

    const token = await signDeveloperToken({
      teamId: "TEAM123456",
      keyId: "KEY7654321",
      privateKeyPem: pem,
      issuedAt,
    });

    const [header, payload, signature] = token.split(".");

    expect(decodeSegment(header!)).toEqual({ alg: "ES256", kid: "KEY7654321" });
    expect(decodeSegment(payload!)).toEqual({
      iss: "TEAM123456",
      iat: issuedAt,
      exp: issuedAt + 15_777_000,
    });

    const rawSignature = Uint8Array.from(
      atob(signature!.replaceAll("-", "+").replaceAll("_", "/")),
      (character) => character.charCodeAt(0),
    );

    expect(rawSignature).toHaveLength(64);
    await expect(
      crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        publicKey,
        rawSignature,
        new TextEncoder().encode(`${header}.${payload}`),
      ),
    ).resolves.toBe(true);
  });

  it("refuses a lifetime above the Apple limit", async () => {
    const { pem } = await makeTestKeyPem();

    await expect(
      signDeveloperToken({
        teamId: "TEAM123456",
        keyId: "KEY7654321",
        privateKeyPem: pem,
        lifetimeInSeconds: 15_777_001,
      }),
    ).rejects.toThrow("15777000");
  });
});

describe("keyIdFromFileName", () => {
  it("reads the id from the Apple file name", () => {
    expect(keyIdFromFileName("AuthKey_ABC1234DEF.p8")).toBe("ABC1234DEF");
  });

  it("returns nothing for another name", () => {
    expect(keyIdFromFileName("my-key.p8")).toBeUndefined();
  });
});

describe("decodePem", () => {
  it("rejects a file with no PEM body", () => {
    expect(() => decodePem("-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----")).toThrow(
      "no PEM body",
    );
  });
});
