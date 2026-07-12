"use client";

import { LifeObject } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { EmptyState } from "@/components/ui/EmptyState";
import { AIProfileView } from "@/components/ai/cards";

interface GrowthTabProps {
  object: LifeObject;
}

export function GrowthTab({ object }: GrowthTabProps) {
  const { t } = useTranslation();

  if (!object.aiProfile) {
    return (
      <EmptyState description={t("aiProfileEmpty")} />
    );
  }

  return <AIProfileView profile={object.aiProfile} />;
}
