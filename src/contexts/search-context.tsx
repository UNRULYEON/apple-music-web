import { useView } from "@/hooks";
import { viewKey } from "@/lib/views/view";
import { createContext, useMemo, useState, type ReactNode } from "react";

export interface SearchContextType {
  term: string;
  setTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const { view } = useView();
  const key = viewKey(view);

  const [term, setTerm] = useState("");
  const [seen, setSeen] = useState(key);

  // a search belongs to the screen it was typed on, so another screen starts clean
  if (seen !== key) {
    setSeen(key);
    setTerm("");
  }

  const value = useMemo<SearchContextType>(() => ({ term, setTerm }), [term]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
