import { LifeObjectType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

const typeStyles: Record<LifeObjectType, string> = {
  person:
    "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  self: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  event:
    "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  idea:
    "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  goal: "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  project:
    "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  knowledge:
    "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
};

interface ObjectTypeBadgeProps {
  type: LifeObjectType;
  className?: string;
}

export function ObjectTypeBadge({ type, className }: ObjectTypeBadgeProps) {
  const { t } = useTranslation();
  const typeLabels: Record<LifeObjectType, string> = {
    person: t("person"),
    self: t("self"),
    event: t("event"),
    idea: t("idea"),
    goal: t("goal"),
    project: t("project"),
    knowledge: t("knowledge"),
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        typeStyles[type],
        className
      )}
    >
      {typeLabels[type]}
    </span>
  );
}
