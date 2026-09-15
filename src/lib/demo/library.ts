export type DemoRecentlyPlayedType = "albums" | "playlists" | "stations";

export const DEMO_CURATOR = "Amar Kisoensingh";

export interface DemoPlaylist {
  id: string;
  name: string;
  songs: string[];
}

export interface DemoLibrary {
  recentlyPlayed: { type: DemoRecentlyPlayedType; id: string }[];
  albums: string[];
  playlists: DemoPlaylist[];
}

const ALBUMS = [
  "1037732950",
  "1452886606",
  "6807119565",
  "1451901307",
  "1440881047",
  "1471461888",
  "1626195790",
  "1878399948",
  "1464288853",
  "1779566450",
  "1541445413",
  "1875332623",
  "1767047572",
  "1442920123",
  "1443091653",
  "6795782851",
  "1500836561",
  "1541673202",
  "1687104644",
  "1760785800",
  "1762602163",
];

const PLAYLISTS: DemoPlaylist[] = [
  {
    id: "demo.city-pop",
    name: "City Pop & Fusion",
    songs: [
      "1541673399",
      "1443091712",
      "1443091880",
      "1541673408",
      "1443091980",
      "1442920515",
      "1541673417",
      "1442920651",
      "1541673416",
      "1442920914",
      "1541673413",
      "1442921036",
      "1500836562",
      "1500836583",
    ],
  },
  {
    id: "demo.rap-rotation",
    name: "Rap Rotation",
    songs: [
      "1440881684",
      "1626195811",
      "1451902446",
      "1878400037",
      "1779566523",
      "1440881357",
      "1451902834",
      "1541445429",
      "1767047575",
      "1626196099",
      "1878400231",
      "1779566512",
      "1451903882",
      "1471461890",
      "1541445428",
      "1779566524",
      "1451903287",
    ],
  },
  {
    id: "demo.late-night",
    name: "Late Night Mellow",
    songs: [
      "1452886612",
      "1471461892",
      "1440881708",
      "1452886608",
      "1541445432",
      "1687105074",
      "1878400355",
      "1471462047",
      "1452886607",
      "1626196087",
      "1687105497",
      "1541445431",
      "1471462051",
      "1452886615",
      "1687105495",
    ],
  },
  {
    id: "demo.bright-pop",
    name: "Bright Pop",
    songs: [
      "1037732951",
      "6807119568",
      "6795782855",
      "1875332624",
      "1037732952",
      "1760785805",
      "6795782861",
      "1037732954",
      "1762602164",
      "6795782863",
      "1037732955",
      "6795782853",
      "1037732959",
    ],
  },
  {
    id: "demo.salsa-classics",
    name: "Salsa Classics",
    songs: [
      "1464288855",
      "1464288856",
      "1464288987",
      "1464288857",
      "1464288986",
      "1464288862",
      "1464288858",
      "1464288994",
      "1464288860",
      "1464289006",
      "321443791",
      "1464288996",
      "1301513530",
      "21483663",
      "1526558385",
    ],
  },
];

export const DEMO_LIBRARY: DemoLibrary = {
  recentlyPlayed: ALBUMS.map((id) => ({ type: "albums", id })),
  albums: ALBUMS,
  playlists: PLAYLISTS,
};

export function findDemoPlaylist(id: string): DemoPlaylist | undefined {
  return PLAYLISTS.find((playlist) => playlist.id === id);
}
