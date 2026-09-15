export type DemoRecentlyPlayedType = "albums" | "playlists" | "stations";

export interface DemoLibrary {
  recentlyPlayed: { type: DemoRecentlyPlayedType; id: string }[];
  albums: string[];
  playlists: string[];
}

export const DEMO_LIBRARY: DemoLibrary = {
  recentlyPlayed: [
    { type: "albums", id: "1109714933" },
    { type: "albums", id: "594061854" },
  ],
  albums: ["1109714933", "594061854", "1440857781"],
  playlists: [],
};
