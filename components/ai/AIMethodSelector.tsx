"use client";

import { PenLine, Sparkles } from "lucide-react";
import { LifeObjectType } from "@/lib/types";
import { useTranslation } from "@/lib/useTranslation";
import { ObjectTypeBadge } from "@/components/object/ObjectTypeBadge";
import { Card } from "@/components/ui/Card";

interface AIMethodSelectorProps {
  type: LifeObjectType;
  onManual: () => void;
  onAI: () => void;
}

export function AIMethodSelector({ type, onManual, onAI }: AIMethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Card className="text-center">
        <p className="text-sm text-muted-foreground">{t("chooseType")}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <ObjectTypeBadge type={type} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onManual}
          className="flex flex-col items-start gap-3 rounded-xl border border-input bg-background p-6 text-left transition-colors hover:border-accent hover:bg-accent/5"
        >
          <div className="rounded-full bg-muted p-3">
            <PenLine className="h-6 w-6 text-foreground" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">{t("manualCreate")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("manualCreateSubtitle")}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onAI}
          className="flex flex-col items-start gap-3 rounded-xl border border-accent/20 bg-accent/5 p-6 text-left transition-colors hover:border-accent hover:bg-accent/10"
        >
          <div className="rounded-full bg-accent/10 p-3">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">{t("aiCreate")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("aiCreateSubtitle")}</p>
          </div>
        </button>
      </div>
    </div>
  );
}
