"use client";

import Link from "next/link";
import { Quote } from "lucide-react";
import { IntelligenceEvidence } from "@/lib/types";
import { resolveCompanionEvidence } from "@/lib/companion/evidenceResolver";

export interface CompanionEvidenceListProps {
  evidence: IntelligenceEvidence[];
}

export function CompanionEvidenceList({ evidence }: CompanionEvidenceListProps) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {evidence.map((item, index) => {
        const resolved = resolveCompanionEvidence(item);
        return (
          <Link
            key={index}
            href={resolved.href}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/30 hover:text-accent"
            title={resolved.quote}
          >
            <Quote className="h-3 w-3 shrink-0" />
            <span className="truncate">{resolved.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
