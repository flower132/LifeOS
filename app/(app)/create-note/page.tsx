"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NoteForm } from "@/components/note/NoteForm";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { useTranslation } from "@/lib/useTranslation";
import { SkeletonBlock, SkeletonText } from "@/components/ui/Skeleton";

export default function CreateNotePage() {
  return (
    <Suspense fallback={<CreateNoteFallback />}>
      <CreateNoteContent />
    </Suspense>
  );
}

function CreateNoteContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const objectId = searchParams.get("objectId") || undefined;

  return (
    <WorkspaceLayout
      backHref={objectId ? `/objects/${objectId}` : "/home"}
      backLabel={objectId ? t("backToObject") : t("backToHome")}
      title={t("createNoteTitle")}
      subtitle={t("createNoteSubtitle")}
    >
      <NoteForm key={objectId ?? "new-note"} initialObjectId={objectId} />
    </WorkspaceLayout>
  );
}

function CreateNoteFallback() {
  return (
    <WorkspaceLayout
      title=""
      showBackButton={false}
      loading
      loadingSkeleton={
        <div className="space-y-6">
          <SkeletonText className="h-8 w-48" />
          <SkeletonBlock className="h-64" />
        </div>
      }
    />
  );
}
