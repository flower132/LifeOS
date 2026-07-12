"use client";

import { AdvisorResult } from "@/lib/ai/advisor/types";
import { EvidenceList } from "./EvidenceList";
import { useTranslation } from "@/lib/useTranslation";
import { Card } from "@/components/ui/Card";

interface AdvisorOutputProps {
  result: AdvisorResult;
}

export function AdvisorOutput({ result }: AdvisorOutputProps) {
  const { t } = useTranslation();

  const sections: { key: keyof AdvisorResult; title: string }[] = [
    { key: "context", title: t("advisorSectionContext") },
    { key: "whatINotice", title: t("advisorSectionWhatINotice") },
    { key: "suggestion", title: t("advisorSectionSuggestion") },
    { key: "why", title: t("advisorSectionWhy") },
  ];

  return (
    <div className="space-y-5">
      {sections.map(({ key, title }) => {
        const section = result[key];
        return (
          <Card
            key={key}
            className="space-y-2"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </h3>
            <div className="space-y-2">
              {section.content.split("\n").map((paragraph, i) =>
                paragraph ? (
                  <p
                    key={i}
                    className="text-sm leading-relaxed text-foreground"
                  >
                    {paragraph}
                  </p>
                ) : null
              )}
            </div>
            <EvidenceList evidence={section.evidence} />
          </Card>
        );
      })}
    </div>
  );
}
