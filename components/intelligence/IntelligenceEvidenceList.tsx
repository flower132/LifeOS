"use client";

import Link from "next/link";
import { useNoteStore } from "@/stores/noteStore";
import { useObjectStore } from "@/stores/objectStore";
import { IntelligenceEvidence } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";

interface IntelligenceEvidenceListProps {
  evidence: IntelligenceEvidence[];
}

const EVIDENCE_REF_REGEX = /^(note|memory|object):(.+)$/;

function resolveEvidence(evidence: IntelligenceEvidence) {
  const match = evidence.source.trim().match(EVIDENCE_REF_REGEX);
  if (!match) return null;
  const kind = match[1];
  const id = match[2];
  return { kind, id };
}

export function IntelligenceEvidenceList({ evidence }: IntelligenceEvidenceListProps) {
  const { t } = useTranslation();
  const notes = useNoteStore((s) => s.notes);
  const objects = useObjectStore((s) => s.objects);

  if (evidence.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">{t("advisorEvidencePrefix")}</span>
      {evidence.map((ev, index) => {
        const resolved = resolveEvidence(ev);
        if (!resolved) {
          return (
            <span
              key={`${ev.source}-${index}`}
              className="max-w-[200px] truncate rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
              title={ev.quote}
            >
              {ev.quote || ev.source}
            </span>
          );
        }

        let href = "#";
        let label = "";
        if (resolved.kind === "note") {
          const note = notes.find((n) => n.id === resolved.id);
          href = note?.object_id ? `/objects/${note.object_id}?note=${resolved.id}` : "#";
          label = t("evidenceFromNote");
        } else if (resolved.kind === "memory" || resolved.kind === "object") {
          const object = objects.find((o) => o.id === resolved.id);
          href = object ? `/objects/${resolved.id}` : "#";
          label = resolved.kind === "memory" ? t("evidenceFromMemory") : t("evidenceFromObject");
        }

        return (
          <Link
            key={`${ev.source}-${index}`}
            href={href}
            className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            title={ev.quote}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
