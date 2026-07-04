"use client";

import Link from "next/link";
import {
  Sparkles,
  PenLine,
  List,
  ScanLine,
  FileSpreadsheet,
} from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

export function CreateHub() {
  const { t } = useTranslation();

  const options = [
    {
      href: "/create-object/ai",
      icon: Sparkles,
      title: t("createSpaceAIRecommended"),
      description: t("createSpaceAIDescription"),
      recommended: true,
    },
    {
      href: "/create-object/manual",
      icon: PenLine,
      title: t("createSpaceManual"),
      description: t("createSpaceManualDescription"),
    },
    {
      href: "/create-object/batch",
      icon: List,
      title: t("createSpaceBatch"),
      description: t("createSpaceBatchDescription"),
    },
    {
      href: "/create-object/ocr",
      icon: ScanLine,
      title: t("createSpaceOCR"),
      description: t("createSpaceOCRDescription"),
    },
    {
      href: "/create-object/import",
      icon: FileSpreadsheet,
      title: t("createSpaceFileImport"),
      description: t("createSpaceFileImportDescription"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <Link
            key={option.href}
            href={option.href}
            className="group relative flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/30 hover:bg-accent/[0.02]"
          >
            {option.recommended && (
              <span className="absolute right-4 top-4 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {t("createSpaceAIRecommendedBadge")}
              </span>
            )}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent"
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-medium text-foreground">{option.title}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
