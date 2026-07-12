"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/useTranslation";
import { Spinner } from "@/components/ui/Spinner";

interface AdvisorInputProps {
  onSubmit: (question: string) => void | Promise<void>;
  isLoading?: boolean;
}

export function AdvisorInput({ onSubmit, isLoading = false }: AdvisorInputProps) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;
    void onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t("advisorInputLabel")}
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("advisorInputPlaceholder")}
          rows={5}
          disabled={isLoading}
          className="w-full resize-y rounded-lg border border-input bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={!question.trim() || isLoading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" />
            {t("advisorGenerating")}
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {t("advisorSubmit")}
          </>
        )}
      </button>
    </form>
  );
}
