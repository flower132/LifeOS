"use client";

import { LifeObject, PersonAIProfile, GoalAIProfile } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface AIProfileTabProps {
  object: LifeObject;
}

export function AIProfileTab({ object }: AIProfileTabProps) {
  const { t } = useTranslation();

  if (!object.aiProfile) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("aiProfileEmpty")}
      </div>
    );
  }

  if (object.type === "person") {
    return <PersonAIProfileView profile={object.aiProfile as PersonAIProfile} />;
  }

  if (object.type === "goal") {
    return <GoalAIProfileView profile={object.aiProfile as GoalAIProfile} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <pre className="overflow-x-auto text-xs text-muted-foreground">
        {JSON.stringify(object.aiProfile, null, 2)}
      </pre>
    </div>
  );
}

function PersonAIProfileView({ profile }: { profile: PersonAIProfile }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card label={t("aiProfileMbti")}>{profile.mbti || t("aiNotAvailable")}</Card>
        <Card label={t("aiProfileMbtiConfidence")}>
          {profile.mbtiConfidence}%
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("aiProfileBigFive")}
        </h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(Object.keys(profile.bigFive) as Array<keyof PersonAIProfile["bigFive"]>).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{key}</span>
                <span className="font-medium text-foreground">{profile.bigFive[key]}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${profile.bigFive[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card label={t("aiProfileSummary")}>
        {profile.personalitySummary || t("aiNotAvailable")}
      </Card>
    </div>
  );
}

function GoalAIProfileView({ profile }: { profile: GoalAIProfile }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card label={t("aiGoalDifficulty")}>{profile.difficulty} / 10</Card>
        <Card label={t("aiGoalSuccessProbability")}>{profile.successProbability}%</Card>
        <Card label={t("aiGoalMotivationType")}>
          {t(`aiGoalMotivation${profile.motivationType.charAt(0).toUpperCase() + profile.motivationType.slice(1)}`)}
        </Card>
        <Card label={t("aiGoalEstimatedDuration")}>
          {profile.estimatedDuration || t("aiNotAvailable")}
        </Card>
      </div>

      <Card label={t("aiGoalRequiredResources")}>
        {profile.requiredResources.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4">
            {profile.requiredResources.map((resource, i) => (
              <li key={i}>{resource}</li>
            ))}
          </ul>
        ) : (
          t("aiNotAvailable")
        )}
      </Card>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}
