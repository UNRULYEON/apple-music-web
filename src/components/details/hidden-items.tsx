// a search takes rows out of a list. This says so, or a person could think the list
// holds fewer rows than it does.
export function HiddenItems({
  shown,
  total,
  noun,
}: {
  shown: number;
  total: number;
  noun: string;
}) {
  if (shown >= total) {
    return null;
  }

  return (
    <div className="text-center text-xs text-neutral-500 dark:text-neutral-400">
      {shown} of {total} {noun}. Clear the search to see them all.
    </div>
  );
}
