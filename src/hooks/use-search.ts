import { useContext } from "react";
import { SearchContext, type SearchContextType } from "@/contexts";

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch needs a SearchProvider above it.");
  }

  return context;
}
