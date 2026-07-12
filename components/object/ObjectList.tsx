import { LifeObject } from "@/lib/types";
import { ObjectCard } from "./ObjectCard";
import { VirtualObjectGrid } from "./VirtualObjectGrid";
import { EmptyState } from "@/components/ui/EmptyState";

interface ObjectListProps {
  objects: LifeObject[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  mode?: "view" | "manage";
  selectedIds?: Set<string>;
  lockedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onShiftSelect?: (id: string) => void;
}

export function ObjectList({
  objects,
  emptyMessage = "No objects yet.",
  emptyAction,
  mode = "view",
  selectedIds,
  lockedIds,
  onToggleSelection,
  onShiftSelect,
}: ObjectListProps) {
  if (objects.length === 0) {
    return (
      <EmptyState
        description={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <VirtualObjectGrid
      items={objects}
      renderItem={(item) => {
        const object = item as LifeObject;
        const isSelected = selectedIds?.has(object.id) ?? false;
        const isLocked = lockedIds?.has(object.id) ?? object.type === "self";
        return (
          <ObjectCard
            key={object.id}
            object={object}
            mode={mode}
            selected={isSelected}
            locked={isLocked}
            onToggle={() => onToggleSelection?.(object.id)}
            onShiftClick={() => onShiftSelect?.(object.id)}
          />
        );
      }}
    />
  );
}
