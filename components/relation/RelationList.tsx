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
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">No relations yet. Relations give the system its structure.</p>
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
            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                {other?.name.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {other?.name || "Unknown"}
                </p>
                <p className="text-xs text-slate-500">
                  {relation.type}
                  {relation.strength !== undefined &&
                    ` • ${Math.round(relation.strength * 100)}%`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {relation.note && (
                <p className="max-w-[200px] truncate text-xs text-slate-500">
                  {relation.note}
                </p>
              )}
              <p className="text-xs text-slate-400">{formatDate(relation.created_at)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
