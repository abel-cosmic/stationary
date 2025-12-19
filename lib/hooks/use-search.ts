import { useMemo } from "react";
import { useSearchStore } from "@/lib/stores";

/**
 * Custom hook for managing search state
 * Provides convenient access to search store and filtering functionality
 */
export function useSearch<T>(
  context: string,
  items: T[],
  searchFn: (item: T, query: string) => boolean
) {
  const query = useSearchStore((state) => state.getSearchQuery(context));
  const setQuery = useSearchStore((state) => state.setSearchQuery);
  const clearSearch = useSearchStore((state) => state.clearSearch);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => searchFn(item, query));
  }, [items, query, searchFn]);

  return {
    query,
    setQuery: (newQuery: string) => setQuery(context, newQuery),
    clearSearch: () => clearSearch(context),
    filteredItems,
  };
}
