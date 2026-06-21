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
            {this.state.error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-left text-xs text-destructive">
                {this.state.error.message}
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
                onClick={this.handleReload}
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

    return this.props.children;
  }
}
