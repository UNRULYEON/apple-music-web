// a person types what they remember, not what Apple stored. The match ignores case and
// accent marks, so "bjork" finds "Björk", and it looks anywhere in the text.
export function matchesSearch(term: string, ...fields: (string | undefined)[]): boolean {
  const wanted = plain(term);

  if (wanted === "") {
    return true;
  }

  return fields.some((field) => field !== undefined && plain(field).includes(wanted));
}

function plain(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
