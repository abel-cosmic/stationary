import { useMemo } from "react";
import { usePaginationStore } from "@/lib/stores";

/**
 * Custom hook for managing pagination state
 * Provides convenient access to pagination store and computed values
 */
export function usePagination<T>(
  tableId: string,
  items: T[],
  defaultItemsPerPage: number = 25
) {
  const pagination = usePaginationStore((state) =>
    state.getPagination(tableId)
  );
  const setPage = usePaginationStore((state) => state.setPage);
  const setItemsPerPage = usePaginationStore((state) => state.setItemsPerPage);

  const currentPage = pagination.currentPage || 1;
  const itemsPerPage = pagination.itemsPerPage || defaultItemsPerPage;

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setPage(tableId, page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(tableId, items);
  };

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    setPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
  };
}
