import { Relation } from "@/lib/types";
import { useObjectStore } from "@/stores/objectStore";
import { formatDate } from "@/lib/utils";

interface RelationListProps {
  objectId: string;
  relations: Relation[];
}

export function RelationList({ objectId, relations }: RelationListProps) {
  const { getById } = useObjectStore();

  if (relations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">No relations yet. Relations give the system its structure.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {relations.map((relation) => {
        const otherId =
          relation.source_object_id === objectId
            ? relation.target_object_id
            : relation.source_object_id;
        const other = getById(otherId);
        return (
          <div
            key={relation.id}
            className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                {other?.name.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {other?.name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {relation.type}
                  {relation.strength !== undefined &&
                    ` • ${Math.round(relation.strength * 100)}%`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {relation.note && (
                <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {relation.note}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{formatDate(relation.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
