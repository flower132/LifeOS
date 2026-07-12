"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateHub } from "@/components/create/CreateHub";
import { CreationSuccessBanner } from "@/components/create/CreationSuccessBanner";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { useTranslation } from "@/lib/useTranslation";

export default function CreateObjectPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Preserve legacy deep links from home / templates by redirecting to the manual wizard.
  useEffect(() => {
    const typeParam = searchParams.get("type");
    const templateParam = searchParams.get("template");

    if (typeParam || templateParam) {
      const params = new URLSearchParams();
      if (typeParam) params.set("type", typeParam);
      if (templateParam) params.set("template", templateParam);
      router.replace(`/create-object/manual?${params.toString()}`);
    }
  }, [searchParams, router]);

  return (
    <WorkspaceLayout
      title={t("createSpaceHubTitle")}
      subtitle={t("createSpaceHubSubtitle")}
      showBackButton={false}
    >
      <div className="space-y-6">
        <CreationSuccessBanner />
        <CreateHub />
      </div>
    </WorkspaceLayout>
  );
}
