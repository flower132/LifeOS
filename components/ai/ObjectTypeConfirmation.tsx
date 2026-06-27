"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LifeObjectType } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";

interface ObjectTypeConfirmationProps {
  type: LifeObjectType;
}

export function ObjectTypeConfirmation({ type }: ObjectTypeConfirmationProps) {
  const { t } = useTranslation();

  return (
    <div data-testid="object-type-confirmation" className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ObjectTypeBadge type={type} />
            <span className="text-sm text-muted-foreground">
              {t(`createObjectAISubtitle_${type}`)}</span>
          </div>
        </div>
        <Link
          href="/create-object"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("changeObjectType")}
        </Link>
      </div>
    </div>
  );
}
