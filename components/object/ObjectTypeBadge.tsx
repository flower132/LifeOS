import { LifeObjectType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/useTranslation";

const typeStyles: Record<LifeObjectType, string> = {
  person: "bg-blue-50 text-blue-700 border-blue-100",
  self: "bg-indigo-50 text-indigo-700 border-indigo-100",
  event: "bg-amber-50 text-amber-700 border-amber-100",
  idea: "bg-emerald-50 text-emerald-700 border-emerald-100",
  goal: "bg-rose-50 text-rose-700 border-rose-100",
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
