"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { useAuthActions } from "@/lib/auth/useAuthActions";
import { ErrorState } from "@/components/ui/ErrorState";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading, error, successMsg } = useAuthActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  return (
    <AuthPageShell
      mode="login"
      footerLink={
        <>
          没有账号？{" "}
          <Link
            href="/register"
            className="font-medium text-accent underline-offset-4 hover:underline"
          >
            注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20"
        />

        {error && (
          <ErrorState description={error} />
        )}
        {successMsg && (
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
    </AuthPageShell>
  );
}
