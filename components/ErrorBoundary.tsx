"use client";

import React from "react";
import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[LifeOS] ErrorBoundary caught error:", error, info);
  }

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-slate-900">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              出现错误
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              应用遇到了意外错误。你的数据安全地保存在 localStorage 中。
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              The app encountered an unexpected error. Your data is safe in
              localStorage.
            </p>
            {this.state.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700"
              >
                <Home className="h-4 w-4" />
                返回首页
              </Link>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                重新加载
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
