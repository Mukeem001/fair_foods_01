import { useCallback, useEffect, useState } from "react";

export const PRODUCTS_PAGE_SIZE = 6;

export function usePaginatedList<T>(items: T[], pageSize = PRODUCTS_PAGE_SIZE, resetKey = "") {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [resetKey, pageSize]);

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;
  const remaining = items.length - visibleCount;

  const loadMore = useCallback(() => {
    setVisibleCount((count) => Math.min(count + pageSize, items.length));
  }, [items.length, pageSize]);

  return { visible, hasMore, loadMore, remaining, total: items.length };
}
