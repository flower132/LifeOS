"use client";

import { ObjectAIProfile } from "@/lib/types";
import { aiProfileRegistry } from "@/lib/ai/objectIntelligence/profiles";

export interface AIProfileViewProps {
  profile: ObjectAIProfile;
}

export function AIProfileView({ profile }: AIProfileViewProps) {
  const definition = aiProfileRegistry.get(profile.type);
  const ProfileReader = definition?.ProfileReader;

  if (!ProfileReader) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <pre className="overflow-x-auto text-xs text-muted-foreground">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    );
  }

  return <ProfileReader profile={profile} />;
}
