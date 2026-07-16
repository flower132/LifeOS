import { IntelligenceEvidence } from "@/lib/types";

const EVIDENCE_REF_REGEX = /^(note|memory|relation|object):(.+)$/;

export interface ResolvedEvidence extends IntelligenceEvidence {
  href: string;
  label: string;
}

export function resolveCompanionEvidence(
  evidence: IntelligenceEvidence
): ResolvedEvidence {
  const match = evidence.source.trim().match(EVIDENCE_REF_REGEX);
  const kind = match?.[1];
  const id = match?.[2] ?? evidence.source;

  let href = "#";
  let label = "来源";

  switch (kind) {
    case "note":
      href = `/objects?note=${id}`;
      label = "来自记忆";
      break;
    case "memory":
      href = `/objects/${id}?tab=memories`;
      label = "来自 AI 记忆";
      break;
    case "relation":
      href = `/objects/${id}?tab=overview`;
      label = "来自关系";
      break;
    case "object":
      href = `/objects/${id}`;
      label = "来自对象";
      break;
    default:
      href = "#";
      label = "来源";
  }

  return { ...evidence, href, label };
}

export function resolveCompanionEvidenceList(
  evidence: IntelligenceEvidence[]
): ResolvedEvidence[] {
  return evidence.map(resolveCompanionEvidence);
}
