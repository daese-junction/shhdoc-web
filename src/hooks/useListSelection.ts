"use client";

import { useCallback, useMemo, useState } from "react";

/** 페이지를 넘겨도 유지되는 목록 행 선택 상태 */
export function useListSelection() {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const select = useCallback((ids: string[], selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (selected ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const selection = useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isSelected: (id: string) => selectedIds.has(id),
      toggle,
      select,
      clear,
    }),
    [selectedIds, toggle, select, clear],
  );

  return selection;
}

export type ListSelection = ReturnType<typeof useListSelection>;
