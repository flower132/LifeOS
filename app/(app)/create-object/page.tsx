"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateHub } from "@/components/create/CreateHub";
import { CreationSuccessBanner } from "@/components/create/CreationSuccessBanner";
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("createSpaceHubTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("createSpaceHubSubtitle")}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <CreationSuccessBanner />
        <CreateHub />
      </div>
    </div>
  );
}
