import { createContext, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStatus, useView } from "@/hooks";
import { viewKey } from "@/lib/views/view";

export interface SearchContextType {
  term: string;
  setTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { view } = useView();
  const status = useAuthStatus();
  const key = viewKey(view);

  const [terms, setTerms] = useState<Record<string, string>>({});

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
