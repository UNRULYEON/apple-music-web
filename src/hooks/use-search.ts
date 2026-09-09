import { SearchContext, type SearchContextType } from "@/contexts/search-context";
import { useContext } from "react";

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch needs a SearchProvider above it.");
  }

  return context;
}
