import { Template } from "@/lib/types";
import { TemplateCard } from "./TemplateCard";

interface TemplateListProps {
  templates: Template[];
  title: string;
  emptyText: string;
  onEdit?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  onUse?: (template: Template) => void;
  showActions?: boolean;
}

export function TemplateList({
  templates,
  title,
  emptyText,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
  showActions = true,
}: TemplateListProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              showActions={showActions}
              onEdit={onEdit ? () => onEdit(template) : undefined}
              onDuplicate={onDuplicate ? () => onDuplicate(template) : undefined}
              onDelete={onDelete ? () => onDelete(template) : undefined}
              onUse={onUse ? () => onUse(template) : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
