import { Copy, Edit2, Trash2, FileText } from "lucide-react";
import { Template, TemplateCategory } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

const categoryStyles: Record<
  TemplateCategory,
  { bg: string; text: string; darkBg: string; darkText: string }
> = {
  person: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    darkBg: "dark:bg-blue-900/30",
    darkText: "dark:text-blue-300",
  },
  self: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    darkBg: "dark:bg-emerald-900/30",
    darkText: "dark:text-emerald-300",
  },
  goal: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    darkBg: "dark:bg-rose-900/30",
    darkText: "dark:text-rose-300",
  },
  event: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    darkBg: "dark:bg-amber-900/30",
    darkText: "dark:text-amber-300",
  },
  idea: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    darkBg: "dark:bg-indigo-900/30",
    darkText: "dark:text-indigo-300",
  },
  task: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    darkBg: "dark:bg-slate-800",
    darkText: "dark:text-slate-300",
  },
  custom: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    darkBg: "dark:bg-purple-900/30",
    darkText: "dark:text-purple-300",
  },
};

interface TemplateCardProps {
  template: Template;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onUse?: () => void;
  showActions?: boolean;
}

export function TemplateCard({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  onUse,
  showActions = true,
}: TemplateCardProps) {
  const { t, language } = useTranslation();
  const styles = categoryStyles[template.category];

  const formattedDate = template.lastUsedAt
    ? new Date(template.lastUsedAt).toLocaleDateString(language === "zh" ? "zh-CN" : undefined)
    : null;

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="line-clamp-1 text-sm font-semibold text-card-foreground">
            {template.name}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} ${styles.darkBg} ${styles.darkText}`}
        >
          {t(`templateCategory_${template.category}`)}
        </span>
      </div>

      <p className="mb-4 line-clamp-3 flex-1 whitespace-pre-wrap text-xs text-muted-foreground">
        {template.content || t("noTemplatesFound")}
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span>{t("templateUsageCount", { count: String(template.usageCount) })}</span>
          {formattedDate && (
            <span>
              {t("templateLastUsed")}: {formattedDate}
            </span>
          )}
        </div>
        {template.isDefault && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
            {t("templateDefaultLabel")}
          </span>
        )}
      </div>

      {showActions && (
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
          {onUse && (
            <button
              type="button"
              onClick={onUse}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
            >
              {t("createFromTemplate")}
            </button>
          )}
          {onEdit && !template.isDefault && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("editTemplate")}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t("duplicateTemplate")}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && !template.isDefault && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10"
              aria-label={t("deleteTemplate")}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
