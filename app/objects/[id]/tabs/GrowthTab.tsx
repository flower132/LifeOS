"use client";

import { LifeObject, SelfAIProfile } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface GrowthTabProps {
  object: LifeObject;
}

export function GrowthTab({ object }: GrowthTabProps) {
  const { t } = useTranslation();
  const profile = object.aiProfile as SelfAIProfile | undefined;

  if (!profile) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiProfileEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card label={t("selfCurrentFocus")}>
        {profile.currentFocus || t("aiNotAvailable")}
      </Card>

      <Card label={t("selfUnderstanding")}>
        {profile.understandingSummary || t("aiNotAvailable")}
      </Card>

      <Card label={t("selfGrowthThemes")}>
        {profile.growthThemes.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {profile.growthThemes.map((theme, i) => (
              <li
                key={i}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm text-accent"
              >
                {theme}
              </li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </Card>

      <Card label={t("selfReflectionSeeds")}>
        {profile.reflectionSeeds.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
            {profile.reflectionSeeds.map((seed, i) => (
              <li key={i}>{seed}</li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </Card>

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("selfLifePattern")}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MiniCard label={t("lifePatternRepeatedTopics")}>
            {profile.lifePattern.repeatedTopics}
          </MiniCard>
          <MiniCard label={t("lifePatternGoalChanges")}>
            {profile.lifePattern.goalChanges}
          </MiniCard>
          <MiniCard label={t("lifePatternEmotionalTrend")}>
            {profile.lifePattern.emotionalTrend
              ? [profile.lifePattern.emotionalTrend]
              : []}
          </MiniCard>
          <MiniCard label={t("lifePatternRelationshipChanges")}>
            {profile.lifePattern.relationshipChanges}
          </MiniCard>
          <MiniCard label={t("lifePatternLearningDirections")}>
            {profile.lifePattern.learningDirections}
          </MiniCard>
          <MiniCard label={t("lifePatternValueEvolution")}>
            {profile.lifePattern.valueEvolution}
          </MiniCard>
        </div>
      </div>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm leading-relaxed text-foreground">{children}</div>
    </div>
  );
}

function MiniCard({
  label,
  children,
}: {
  label: string;
  children: string[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-4 text-sm text-foreground">
          {children.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("aiNotAvailable")}</p>
      )}
    </div>
  );
}
