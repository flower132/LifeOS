"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { MigrationDialog } from "@/components/sync/MigrationDialog";
import { ConflictResolutionDialog } from "@/components/sync/ConflictResolutionDialog";
import {
  checkMigration,
  migrateLocalToRemote,
  pullRemoteToLocal,
  resolveConflict,
  shouldRedirectToMigration,
  MigrationCheckResult,
} from "@/lib/sync/MigrationService";

export default function MigrationPage() {
  const router = useRouter();
  const [result, setResult] = useState<MigrationCheckResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMigrate = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await migrateLocalToRemote();
      setIsComplete(true);
      setTimeout(() => router.replace("/home"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "同步失败");
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  const handlePullRemote = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await pullRemoteToLocal();
      setIsComplete(true);
      setTimeout(() => router.replace("/home"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "拉取失败");
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  const handleResolve = useCallback(async (strategy: "merge" | "local" | "remote") => {
    setIsProcessing(true);
    setError(null);
    try {
      await resolveConflict(strategy);
      setIsComplete(true);
      setTimeout(() => router.replace("/home"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "合并失败");
    } finally {
      setIsProcessing(false);
    }
  }, [router]);

  useEffect(() => {
    if (!shouldRedirectToMigration()) {
      router.replace("/home");
      return;
    }

    let cancelled = false;
    checkMigration()
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          if (
            r.status === "empty" ||
            (r.status === "migrate" && !r.localSnapshot && r.remoteSummary?.hasData)
          ) {
            // local empty + remote has data: auto pull
            void handlePullRemote();
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "检测失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, handlePullRemote]);

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">正在检测数据…</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
          <p className="mt-4 text-sm text-muted-foreground">正在同步数据…</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="mt-4 text-base font-medium text-foreground">
            你的 LifeOS 已开始同步。
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            以后所有数据都会保存到账号。
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (
    result.status === "migrate" &&
    result.localSnapshot &&
    !result.remoteSummary?.hasData
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <MigrationDialog
          stats={result.localStats}
          onMigrate={handleMigrate}
          onKeepLocal={() => router.replace("/home")}
        />
      </div>
    );
  }

  if (
    result.status === "conflict" &&
    result.localSnapshot &&
    result.remoteSummary &&
    result.remoteSnapshot
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <ConflictResolutionDialog
          localStats={result.localStats}
          remoteSummary={result.remoteSummary}
          onResolve={handleResolve}
        />
      </div>
    );
  }

  // Fallback: redirect home
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}
