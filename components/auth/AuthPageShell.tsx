"use client";

import Link from "next/link";
import { LocalModeButton } from "./LocalModeButton";
import { useTranslation } from "@/lib/useTranslation";

type AuthMode = "login" | "register";

interface AuthPageShellProps {
  mode: AuthMode;
  children: React.ReactNode;
  footerLink?: React.ReactNode;
}

export function AuthPageShell({ mode, children, footerLink }: AuthPageShellProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 text-center">
        <Link href="/home" className="inline-flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-bold text-accent-foreground shadow-sm">
            L
          </div>
          <span className="text-xl font-semibold tracking-tight">LifeOS</span>
        </Link>
        <p className="mt-4 text-base font-medium text-foreground">
          {t("authTagline")}
        </p>
      </div>

      <div className="space-y-5">
        <LocalModeButton />

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground">{t("authDivider")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <h1 className="text-h1 text-primary">
              {mode === "login" ? t("authLoginTitle") : t("authRegisterTitle")}
            </h1>
          </div>

          {children}
        </div>

        {footerLink && (
          <div className="text-center text-sm text-muted-foreground">{footerLink}</div>
        )}
      </div>
    </div>
  );
}
