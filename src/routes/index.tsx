import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import {
  DetailsView,
  LibraryAlbums,
  LibraryArtists,
  LibraryPlaylists,
  RecentlyPlayed,
} from "@/components";
import { useIsHydrated, useView } from "@/hooks";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Suspense fallback={null}>
      <HomeView />
    </Suspense>
  );
}

function HomeView() {
  const { view } = useView();
  const isHydrated = useIsHydrated();

  if (!isHydrated) {
    return null;
  }

  if (view.name === "detail") {
    return <DetailsView id={view.id} type={view.type} />;
  }

  if (view.name === "list") {
    switch (view.list) {
      case "albums":
        return <LibraryAlbums />;
      case "artists":
        return <LibraryArtists />;
      case "playlists":
        return <LibraryPlaylists />;
      default:
        break;
    }
  }

  return <RecentlyPlayed />;
}
