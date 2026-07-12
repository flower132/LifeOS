"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { useSyncStore } from "@/stores/syncStore";
import { useTranslation } from "@/lib/useTranslation";
import { UserAvatar, UserAvatarFallback } from "@/components/user/UserAvatar";

export function AccountCard() {
  const { t } = useTranslation();
  const profile = useSyncStore((s) => s.profile);

  const displayText = profile
    ? profile.displayName || profile.email
    : t("accountCardTitle");
  const subText = profile
    ? t("accountCardSubtitle")
    : t("accountCardLoginPrompt");

  return (
    <Link
      href="/settings/account"
      className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/20 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        {profile ? (
          <UserAvatar size="md" />
        ) : (
          <UserAvatarFallback size="md" />
        )}
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{displayText}</p>
          <p className="text-xs text-muted-foreground">{subText}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SyncStatusBadge showText={false} />
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
