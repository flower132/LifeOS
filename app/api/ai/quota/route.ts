import { getRemainingQuota } from "@/lib/ai/quota";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// 今日剩余额度 —— 只读 API（首页 / Dashboard 预留，当前无 UI）。
//
// GET /api/ai/quota → QuotaStatus（limits / used / remaining / resetAt）
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  // User identity: no server auth yet — reserved for Supabase session wiring.
  const userId = "local";

  try {
    const status = await getRemainingQuota(userId);
    return Response.json({ success: true, quota: status }, { status: 200 });
  } catch (err) {
    console.error("[ai-quota] status failed:", err);
    return Response.json(
      { success: false, error: { code: "unknown", message: "Failed to load quota status" } },
      { status: 500 }
    );
  }
}
