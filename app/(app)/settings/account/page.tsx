"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Download,
  LogOut,
  Boxes,
  StickyNote,
  Users,
  Tags,
  LayoutTemplate,
  Brain,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { ProfileEditor } from "@/components/settings/ProfileEditor";
import { SyncStatusBadge } from "@/components/settings/SyncStatusBadge";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { UserAvatar, UserAvatarFallback } from "@/components/user/UserAvatar";
import { useAuthActions } from "@/lib/auth/useAuthActions";
import { syncService } from "@/lib/sync/SyncService";
import { useSyncStore } from "@/stores/syncStore";
import { useObjectStore } from "@/stores/objectStore";
import { useNoteStore } from "@/stores/noteStore";
import { useRelationStore } from "@/stores/relationStore";
import { useTagStore } from "@/stores/tagStore";
import { useTemplateStore } from "@/stores/templateStore";
import { exportAllData } from "@/lib/export";
import { useTranslation } from "@/lib/useTranslation";

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-lg font-semibold leading-none text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, signOut } = useAuthActions();
  const syncStatus = useSyncStore();
  const objectCount = useObjectStore((s) => s.objects.length);
  const noteCount = useNoteStore((s) => s.notes.length);
  const relationCount = useRelationStore((s) => s.relations.length);
  const tagCount = useTagStore((s) => s.tags.length);
  const templateCount = useTemplateStore((s) => s.templates.length);
  const objects = useObjectStore((s) => s.objects);

  const stats = useMemo(
    () => ({
      objects: objectCount,
      memories: objects.reduce(
        (sum, obj) =>
          sum + (Array.isArray(obj.memories) ? obj.memories.length : 0),
        0
      ),
      notes: noteCount,
      relations: relationCount,
      tags: tagCount,
      templates: templateCount,
    }),
    [objectCount, objects, noteCount, relationCount, tagCount, templateCount]
  );

  const [isExporting, setIsExporting] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncingNow(true);
    try {
      await syncService.syncNow();
    } finally {
      setIsSyncingNow(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const isGuest = !user;

  return (
    <WorkspaceLayout
      backHref="/settings"
      backLabel={t("backToSettings")}
      title={t("accountTitle") ?? t("accountCardTitle")}
      className="pb-24"
    >
      <div className="space-y-6">
        <div className="mb-8 flex items-center gap-4">
          {isGuest ? (
            <UserAvatarFallback size="lg" />
          ) : (
            <UserAvatar size="lg" />
          )}
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">
              {isGuest ? t("accountLocalMode") : user?.displayName || user?.email || t("accountCardTitle")}
            </p>
            {!isGuest && user?.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <SectionCard>
            {isGuest ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t("accountLocalModeDescription")}</p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
                >
                  {t("accountLoginOrRegister")}
                </button>
              </div>
            ) : (
              <ProfileEditor />
            )}
          </SectionCard>

          {!isGuest && (
            <SectionCard className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">{t("accountSyncStatus")}</h2>
                <SyncStatusBadge />
              </div>

              {syncStatus.error && (
                <p className="text-xs text-destructive">{syncStatus.error}</p>
              )}

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncingNow || !syncStatus.isOnline}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {isSyncingNow ? (
                  <>
                    <Spinner size="sm" />
                    {t("syncStatusSyncing")}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    {t("accountSyncNow")}
                  </>
                )}
              </button>
            </SectionCard>
          )}

          <SectionCard>
            <h2 className="mb-4 text-sm font-medium text-foreground">{t("accountData")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatItem icon={Boxes} label={t("objectsTitle")} value={stats.objects} />
              <StatItem icon={Brain} label={t("detailTab_memories")} value={stats.memories} />
              <StatItem icon={StickyNote} label={t("statNotes")} value={stats.notes} />
              <StatItem icon={Users} label={t("relations")} value={stats.relations} />
              <StatItem icon={Tags} label={t("tags")} value={stats.tags} />
              <StatItem icon={LayoutTemplate} label={t("templatesTitle")} value={stats.templates} />
            </div>
          </SectionCard>

          <SectionCard className="space-y-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? t("accountExporting") : t("accountExportData")}
            </button>

            {!isGuest && (
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                <LogOut className="h-4 w-4" />
                {t("accountSignOut")}
              </button>
            )}
          </SectionCard>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
