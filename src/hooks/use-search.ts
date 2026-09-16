import { useContext } from "react";
import { SearchContext, type SearchContextType } from "@/contexts";

export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }

  return context;
}
