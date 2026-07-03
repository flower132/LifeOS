"use client";

import Link from "next/link";
import { AdvisorEvidence } from "@/lib/ai/advisor/types";
import {
  buildEvidenceHref,
  formatEvidenceLabel,
} from "@/lib/ai/advisor/evidenceResolver";
import { useTranslation } from "@/lib/useTranslation";

interface EvidenceListProps {
  evidence: AdvisorEvidence[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  const { t } = useTranslation();

  if (evidence.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("advisorEvidencePrefix")}</span>
      {evidence.map((ev, index) => {
        if (ev.resolved) {
          return (
            <Link
              key={`${ev.source}-${index}`}
              href={buildEvidenceHref(ev.resolved)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {formatEvidenceLabel(ev.resolved, t)}
            </Link>
          );
        }

        return (
          <span
            key={`${ev.source}-${index}`}
            className="max-w-[200px] truncate rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
            title={ev.quote}
          >
            {ev.quote || ev.source}
          </span>
        );
      })}
    </div>
  );
}
