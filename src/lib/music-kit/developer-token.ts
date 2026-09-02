import { createServerFn } from "@tanstack/react-start";

export function readDeveloperToken(): string {
  const token = process.env.MUSICKIT_DEVELOPER_TOKEN;

  if (!token) {
    throw new Error("MUSICKIT_DEVELOPER_TOKEN is not set. See the MusicKit setup in README.md.");
  }

  return token;
}

export const getDeveloperToken = createServerFn().handler(readDeveloperToken);
