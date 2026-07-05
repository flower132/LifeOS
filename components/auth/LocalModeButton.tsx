"use client";

import { ArrowRight } from "lucide-react";
import { useAuthActions } from "@/lib/auth/useAuthActions";

export function LocalModeButton() {
  const { continueLocal } = useAuthActions();

  return (
    <button
      type="button"
      onClick={continueLocal}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3.5 text-sm font-medium text-foreground shadow-sm transition-all hover:border-accent/30 hover:bg-accent/5 hover:shadow-md active:scale-[0.98]"
    >
      继续使用本地模式
      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
