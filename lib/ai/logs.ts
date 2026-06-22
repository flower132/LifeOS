import { AIErrorCode, AIUsageLog } from "./types";

const AI_LOGS_KEY = "lifeos_ai_logs";
const MAX_LOGS = 50;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function getAILogs(): AIUsageLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AI_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is AIUsageLog =>
          typeof item === "object" &&
          item !== null &&
          typeof item.id === "string" &&
          typeof item.timestamp === "string" &&
          typeof item.provider === "string" &&
          typeof item.model === "string" &&
          typeof item.durationMs === "number" &&
          (item.status === "success" || item.status === "error")
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function addAILog(log: Omit<AIUsageLog, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const logs = getAILogs();
  const entry: AIUsageLog = {
    id: generateId(),
    timestamp: nowIso(),
    ...log,
  };
  const next = [entry, ...logs].slice(0, MAX_LOGS);
  try {
    window.localStorage.setItem(AI_LOGS_KEY, JSON.stringify(next));
  } catch {
    // Storage write failures are best-effort; do not crash the app.
  }
}

export function clearAILogs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AI_LOGS_KEY);
  } catch {
    // Ignore cleanup errors.
  }
}

export function getLastAILog(): AIUsageLog | null {
  const logs = getAILogs();
  return logs[0] ?? null;
}

export function classifyError(error: unknown): {
  message: string;
  code: AIErrorCode;
} {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (msg.includes("fetch") || msg.includes("network")) {
      return { message: "Network Error", code: "network" };
    }
    if (msg.includes("cors") || msg.includes("cross-origin")) {
      return { message: "CORS Error", code: "cors" };
    }
    if (msg.includes("failed to fetch")) {
      return { message: "Network Error", code: "network" };
    }
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("api key is not set")) {
      return { message: "API Key is not set", code: "invalid_key" };
    }
    if (msg.includes("unauthorized") || msg.includes("401")) {
      return { message: "Invalid API Key (401 Unauthorized)", code: "invalid_key" };
    }
    if (msg.includes("403")) {
      return { message: "Forbidden (403)", code: "invalid_key" };
    }
    if (msg.includes("model") && (msg.includes("not found") || msg.includes("does not exist") || msg.includes("invalid"))) {
      return { message: `Model Not Found: ${error.message}`, code: "model_not_found" };
    }
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
      return { message: "Rate Limit Exceeded (429)", code: "rate_limit" };
    }
    if (msg.includes("json") || msg.includes("parse")) {
      return { message: `JSON Parse Error: ${error.message}`, code: "json_parse" };
    }
    if (msg.includes("timeout")) {
      return { message: "Request Timeout", code: "timeout" };
    }
    if (msg.includes("mixed content")) {
      return { message: "Mixed Content Error (HTTPS page calling HTTP API)", code: "mixed_content" };
    }
  }

  return {
    message: error instanceof Error ? error.message : "Unknown AI error",
    code: "unknown",
  };
}

export function detectMixedContent(baseUrl: string): boolean {
  if (typeof window === "undefined") return false;
  if (!baseUrl) return false;
  return (
    window.location.protocol === "https:" && baseUrl.startsWith("http://")
  );
}

export function formatErrorForUser(error: unknown, baseUrl?: string): { message: string; code: AIErrorCode } {
  if (baseUrl && detectMixedContent(baseUrl)) {
    return {
      message: "Mixed Content Error: this page is HTTPS but the AI API uses HTTP. Use an HTTPS API endpoint or run locally.",
      code: "mixed_content",
    };
  }
  return classifyError(error);
}
