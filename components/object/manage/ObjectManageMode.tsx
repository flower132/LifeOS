"use client";

import { useCallback, useMemo, useState } from "react";
import { LifeObject } from "@/lib/types";

interface ObjectManageModeBag {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  selectRange: (fromId: string, toId: string) => void;
  shiftSelect: (toId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  selectedCount: number;
}

interface ObjectManageModeProps {
  objects: LifeObject[];
  lockedIds?: Set<string>;
  children: (bag: ObjectManageModeBag) => React.ReactNode;
}

export function ObjectManageMode({
  objects,
  lockedIds,
  children,
}: ObjectManageModeProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const effectiveLockedIds = useMemo(() => {
    if (lockedIds) return lockedIds;
    return new Set(objects.filter((o) => o.type === "self").map((o) => o.id));
  }, [lockedIds, objects]);

  const visibleIds = useMemo(
    () => objects.filter((o) => !effectiveLockedIds.has(o.id)).map((o) => o.id),
    [objects, effectiveLockedIds]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    if (effectiveLockedIds.has(id)) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastSelectedId(id);
  }, [effectiveLockedIds]);

  const selectRange = useCallback(
    (fromId: string, toId: string) => {
      if (effectiveLockedIds.has(toId)) return;

      const fromIndex = visibleIds.indexOf(fromId);
      const toIndex = visibleIds.indexOf(toId);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (fromIndex === -1 || toIndex === -1) {
          next.add(toId);
          return next;
        }

        const start = Math.min(fromIndex, toIndex);
        const end = Math.max(fromIndex, toIndex);
        for (let i = start; i <= end; i++) {
          next.add(visibleIds[i]);
        }
        return next;
      });
      setLastSelectedId(toId);
    },
    [effectiveLockedIds, visibleIds]
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(visibleIds));
    if (visibleIds.length > 0) {
      setLastSelectedId(visibleIds[visibleIds.length - 1]);
    }
  }, [visibleIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
    setLastSelectedId(null);
  }, []);

  const shiftSelect = useCallback(
    (toId: string) => {
      if (lastSelectedId) {
        selectRange(lastSelectedId, toId);
      } else {
        toggle(toId);
      }
    },
    [lastSelectedId, selectRange, toggle]
  );

  const bag: ObjectManageModeBag = {
    selectedIds,
    isSelected,
    toggle,
    selectRange,
    shiftSelect,
    selectAll,
    deselectAll,
    selectedCount: selectedIds.size,
  };

  return <>{children(bag)}</>;
}
