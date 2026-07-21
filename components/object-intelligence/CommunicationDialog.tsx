"use client";

import { useState } from "react";
import { LifeObject } from "@/lib/types";
import { PersonAdvice } from "@/lib/object-intelligence";
import { objectIntelligenceEngine } from "@/lib/object-intelligence";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, MessageCircleHeart, AlertTriangle, Lightbulb, Reply, Users } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";

interface CommunicationDialogProps {
  person: LifeObject;
  open: boolean;
  onClose: () => void;
}

/**
 * AI 沟通助手 — PERSON_ADVICE: situational communication guidance grounded
 * in the person's AI profile + memories + relationship context.
 */
export function CommunicationDialog({ person, open, onClose }: CommunicationDialogProps) {
  const { t } = useTranslation();
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<PersonAdvice | null>(null);
  const [failed, setFailed] = useState(false);

  const handleAsk = async () => {
    if (!situation.trim() || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const result = await objectIntelligenceEngine.getCommunicationAdvice(
        person,
        situation.trim()
      );
      setAdvice(result);
      setFailed(!result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${t("communicationAssistant")} · ${person.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <Textarea
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          placeholder={
            t("communicationSituationPlaceholder")
          }
          rows={3}
        />
        <Button onClick={() => void handleAsk()} disabled={loading || !situation.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircleHeart className="h-4 w-4" />}
          {loading ? (t("analyzing")) : (t("getCommunicationAdvice"))}
        </Button>

        {failed && !loading && (
          <p className="text-sm text-muted-foreground">
            {t("communicationAdviceFailed")}
          </p>
        )}

        {advice && !loading && (
          <div className="space-y-3 text-sm">
            {advice.understanding && (
              <p className="rounded-lg bg-muted/50 p-3 text-foreground">
                {advice.understanding}
              </p>
            )}

            {advice.advice.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <Lightbulb className="h-4 w-4 text-accent" />
                  {t("adviceLabel")}
                </p>
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                  {advice.advice.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </div>
            )}

            {advice.warnings.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  {t("warningsLabel")}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {advice.warnings.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {advice.suggestedApproach && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <Reply className="h-4 w-4 text-accent" />
                  {t("suggestedApproachLabel")}
                </p>
                <p className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-foreground">
                  {advice.suggestedApproach}
                </p>
              </div>
            )}

            {advice.possibleReactions.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {t("possibleReactionsLabel")}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {advice.possibleReactions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
