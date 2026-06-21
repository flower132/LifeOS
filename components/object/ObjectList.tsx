import { LifeObject } from "@/lib/types";
import { ObjectCard } from "./ObjectCard";

interface ObjectListProps {
  objects: LifeObject[];
  emptyMessage?: string;
}

export function ObjectList({
  objects,
  emptyMessage = "No objects yet.",
}: ObjectListProps) {
  if (objects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {objects.map((object) => (
        <ObjectCard key={object.id} object={object} />
      ))}
    </div>
  );
}
