"use client";

import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">
          出现错误
        </h1>
        <p className="text-sm text-muted-foreground">
          应用遇到了意外错误。你的数据安全地保存在 localStorage 中。
        </p>
        <p className="text-xs text-muted-foreground">
          The app encountered an unexpected error. Your data is safe in
          localStorage.
        </p>
        {error?.message && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-xs text-destructive">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Home className="h-4 w-4" />
            返回首页
          </Link>
          <button
            type="button"
            onClick={() => {
              reset();
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <RotateCcw className="h-4 w-4" />
            重新加载
          </button>
        </div>
      </div>
    </div>
  );
}
