import { useState, useMemo, useEffect, useRef } from 'react';

/**
 * usePagination - Reusable pagination and item slicing hook.
 *
 * Encapsulates page index, page size, total pages calculation, boundary clamping,
 * item slicing, and automatic page resetting when filter or search dependencies change.
 *
 * @param {Object} options
 * @param {Array} [options.items=[]] - Full list of items to paginate.
 * @param {number} [options.initialPageSize=10] - Initial items per page (-1 for showing all).
 * @param {Array} [options.resetDeps=[]] - Array of filter/search values that trigger a reset to page 1.
 * @returns {Object} Pagination state, sliced items, and controls.
 */
export function usePagination({
  items = [],
  initialPageSize = 10,
  resetDeps = []
} = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Auto-reset page to 1 whenever resetDeps change (safely via ref tracking in an effect)
  const prevDepsRef = useRef(resetDeps);
  useEffect(() => {
    const prevDeps = prevDepsRef.current;
    const hasChanged =
      resetDeps.length !== prevDeps.length ||
      resetDeps.some((dep, i) => !Object.is(dep, prevDeps[i]));

    if (hasChanged) {
      prevDepsRef.current = resetDeps;
      setCurrentPage(1);
    }
  }, [resetDeps]);

  const totalItems = items?.length || 0;
  const totalPages =
    pageSize === -1
      ? 1
      : Math.max(1, Math.ceil(totalItems / (pageSize || 1)));

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (pageSize === -1) return items;
    const start = (safeCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safeCurrentPage, pageSize]);

  const resetPage = () => setCurrentPage(1);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    safeCurrentPage,
    paginatedItems,
    totalItems,
    resetPage
  };
}

