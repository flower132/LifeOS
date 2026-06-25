"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabaseClient";
import { setMode, getMode, signOut } from "@/lib/storage";

type Mode = "local" | "sync";

export default function AuthButton() {
  const [mode, setLocalMode] = useState<Mode>(getMode());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      if (data.user) setUser({ email: data.user.email || "" });
    });
    const { data: listener } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { email: session.user.email || "" } : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      console.log("[LifeOS Debug] SUPABASE_URL:", url);
      console.log("[LifeOS Debug] SUPABASE_KEY prefix:", key?.substring(0, 30) + "...");
      console.log("[LifeOS Debug] SUPABASE_KEY length:", key?.length);

      if (isSignUp) {
        const { data, error } = await getSupabase().auth.signUp({ email, password });
        console.log("[LifeOS Debug] signUp result:", { data, error });
        if (error) throw error;
      } else {
        const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
        console.log("[LifeOS Debug] signIn result:", { data, error });
        if (error) throw error;
      }
      setMode("sync");
      setLocalMode("sync");
    } catch (e: any) {
      console.error("[LifeOS Debug] Auth error:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMode("local");
    setLocalMode("local");
    setUser(null);
  };

  const handleModeSwitch = (m: Mode) => {
    if (m === "local") {
      handleSignOut();
    } else {
      // switching to sync, show login form
      setLocalMode("sync");
    }
  };

  if (mode === "sync" && user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">已登录：{user.email}</p>
            <p className="text-xs text-green-600">数据已同步到云端 ✅</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:underline"
          >
            退出登录
          </button>
        </div>
        <button
          onClick={() => handleModeSwitch("local")}
          className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          切换到本地模式
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded ${mode === "local" ? "bg-gray-200 dark:bg-gray-700" : "bg-blue-100 text-blue-700"}`}>
          {mode === "local" ? "本地模式" : "同步模式"}
        </span>
        <button
          onClick={() => { setLocalMode("local"); setError(""); }}
          className={`text-xs px-2 py-0.5 rounded ${mode === "local" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}
        >
          本地
        </button>
        <button
          onClick={() => { setLocalMode("sync"); setError(""); }}
          className={`text-xs px-2 py-0.5 rounded ${mode === "sync" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}
        >
          同步
        </button>
      </div>

      {mode === "sync" && (
        <div className="space-y-2">
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
          <input
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
          </button>
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="w-full text-xs text-gray-500 hover:underline"
          >
            {isSignUp ? "已有账号？登录" : "没有账号？注册"}
          </button>
        </div>
      )}

      {mode === "local" && (
        <p className="text-xs text-gray-500">数据仅保存在本设备，清除浏览器数据会丢失。</p>
      )}
    </div>
  );
}
