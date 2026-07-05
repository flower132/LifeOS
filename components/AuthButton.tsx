"use client";

import { useAuthActions } from "@/lib/auth/useAuthActions";
import { SyncStatusBadge } from "@/components/settings/SyncStatusBadge";

export default function AuthButton() {
  const { user, signOut } = useAuthActions();

  if (!user) {
    return (
      <a
        href="/login"
        className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
      >
        登录以同步
      </a>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{user.displayName || user.email}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <SyncStatusBadge showText={false} />
      </div>
      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        退出登录
      </button>
    </div>
  );
}
