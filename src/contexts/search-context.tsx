import { useView } from "@/hooks";
import { useAuthStatus } from "@/lib/music-kit/auth";
import { viewKey } from "@/lib/views/view";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

export interface SearchContextType {
  term: string;
  setTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { view } = useView();
  const status = useAuthStatus();
  const key = viewKey(view);

  // one search for each screen, so a person who opens an album and comes back finds the
  // list as they left it. Home and recently played share a name, and so a search too.
  const [terms, setTerms] = useState<Record<string, string>>({});

  // a search belongs to the person who signed in, the way the queue and the cache do
  useEffect(() => {
    if (status === "signed-out") {
      setTerms({});
    }
  }, [status]);

  const setTerm = useCallback(
    (next: string) => setTerms((current) => ({ ...current, [key]: next })),
    [key],
  );

  const value = useMemo<SearchContextType>(
    () => ({ term: terms[key] ?? "", setTerm }),
    [key, setTerm, terms],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
