"use client";

import Link from "next/link";
import { ArrowLeft, List } from "lucide-react";
import { BatchCreateFlow } from "@/components/create/BatchCreateFlow";
import { useTranslation } from "@/lib/useTranslation";

export default function CreateObjectBatchPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/create-object"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("createSpaceBackToHub")}
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <List className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {t("createSpaceBatch")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("createSpaceBatchDescription")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <BatchCreateFlow />
      </div>
    </div>
  );
}
