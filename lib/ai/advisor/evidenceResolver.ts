import {
  AdvisorContext,
  AdvisorEvidence,
  AdvisorEvidenceReference,
} from "./types";

const EVIDENCE_REF_REGEX = /^(note|memory|relation|object):(.+)$/;

export function resolveEvidenceSource(
  source: string,
  context: AdvisorContext
): AdvisorEvidenceReference | undefined {
  const match = source.trim().match(EVIDENCE_REF_REGEX);
  if (!match) return undefined;

  const kind = match[1] as AdvisorEvidenceReference["kind"];
  const id = match[2];

  switch (kind) {
    case "note": {
      const note = context.notes.find((n) => n.id === id);
      if (note) {
        return { kind, id, objectId: note.object_id };
      }
      return undefined;
    }
    case "memory": {
      const memory = context.object.memories?.find((m) => m.id === id);
      if (memory) {
        return { kind, id, objectId: context.object.id };
      }
      return undefined;
    }
    case "relation": {
      const relation = context.relations.find((r) => r.id === id);
      if (relation) {
        return { kind, id, objectId: context.object.id };
      }
      return undefined;
    }
    case "object": {
      const object =
        context.object.id === id
          ? context.object
          : context.relatedObjects.find((o) => o.id === id);
      if (object) {
        return { kind, id, objectId: object.id };
      }
      return undefined;
    }
    default:
      return undefined;
  }
}

export function resolveEvidence(
  evidence: AdvisorEvidence,
  context: AdvisorContext
): AdvisorEvidence {
  return {
    ...evidence,
    resolved: resolveEvidenceSource(evidence.source, context),
  };
}

export function buildEvidenceHref(ref: AdvisorEvidenceReference): string {
  switch (ref.kind) {
    case "note":
      return `/objects/${ref.objectId ?? ref.id}?note=${ref.id}`;
    case "memory":
      return `/objects/${ref.objectId ?? ref.id}?tab=memories`;
    case "relation":
      return `/objects/${ref.objectId ?? ref.id}?tab=overview`;
    case "object":
      return `/objects/${ref.id}`;
    default:
      return "#";
  }
}

export function formatEvidenceLabel(
  ref: AdvisorEvidenceReference,
  t: (key: string) => string
): string {
  switch (ref.kind) {
    case "note":
      return t("evidenceFromNote");
    case "memory":
      return t("evidenceFromMemory");
    case "relation":
      return t("evidenceFromRelation");
    case "object":
      return t("evidenceFromObject");
    default:
      return "";
  }
}
