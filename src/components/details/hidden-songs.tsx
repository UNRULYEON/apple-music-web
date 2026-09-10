// a search takes songs out of the list. This says so, or a person could think the album
// holds fewer songs than it does.
export function HiddenSongs({ shown, total }: { shown: number; total: number }) {
  if (shown >= total) {
    return null;
  }

  return (
    <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
      {shown} of {total} songs. Clear the search to see them all.
    </div>
  );
}
